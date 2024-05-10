const header = document.getElementById('header');
const main = document.getElementById('main');
const quizBox = document.querySelector('.quizbox');
const tablebox = document.querySelector('.tablebox');
const tabMain = document.getElementById('link-main');
const tabList = document.getElementById('link-list');
const recordsPerPage = 15;

let pagination;
const rootURL = (window.location.href).split("?")[0];


class Pagination{
    constructor(page, keyword, limit = 15) {
        this.currentPage = (page == null) ? 1 : Number(page);
        this.filterKeyword = (keyword == null) ? '' : keyword;
        this.paginationLimit = limit;
        this.pageCount = 0;
        this.reload = false;

        document.getElementById("input-page").value = this.currentPage;
        getPageCount(this.filterKeyword);
    }

    disableButton(button){
        button.classList.remove("active");
    }

    enableButton(button){
        button.classList.add("active");
    }

    initPage(){
        this.setCurrentPage(this.currentPage);
    }

    setFirstPage(){
        this.setCurrentPage(1);
    }

    setLastPage(){
        this.setCurrentPage(this.pageCount);
    }
    
    setCurrentPage(page){
        if (! isInteger(page)
        || page < 1
        || page > this.pageCount
        ){
            window.location.replace("404.html");
        }

        this.currentPage = page;
        
        const nextButton = document.getElementById("btn-nextpage");
        const prevButton = document.getElementById("btn-prevpage");
        const firstButton = document.getElementById("btn-firstpage");
        const lastButton = document.getElementById("btn-lastpage");

        if (this.currentPage == 1) {
            this.disableButton(prevButton);
            this.disableButton(firstButton);
        } else {
            this.enableButton(prevButton);
            this.enableButton(firstButton);
        }
    
        if (this.pageCount == this.currentPage) {
            this.disableButton(nextButton);
            this.disableButton(lastButton);
        } else {
            this.enableButton(nextButton);
            this.enableButton(lastButton);
        }

        document.getElementById("input-page").value = page;
        getSentenceList(page, this.filterKeyword);

        if (this.reload) updateURLParams();
    }
}


const isInteger = (v) => {
    if (Number.isInteger(v)) return true;

    if (typeof v !== 'string') return false;

    var n = Math.floor(Number(v));

    return n !== Infinity && String(n) === v;
}


const revealAnswer = () => {
    let questionArea = document.querySelector('.question');
    let answerArea = document.querySelector('.answer');
    let btnReveal = document.getElementById('btn-reveal');
    let btnPlay = document.getElementById('btn-play');

    btnReveal.addEventListener('click', function() {
        var res;

        $.getJSON('/reveal', {}, function (data) {
            console.log("[revealAnswer] Request for the original sentence  before being translated: '" + questionArea.innerText + "'");
            res = data[0];
        })
        .done(function() {
            answerArea.innerText = res.answer;
            btnPlay.classList.add('active');
            console.log("[revealAnswer] Found answer: '" + res.answer + "'");
        })
        .fail(function(jqXHR, textStatus, errorThrown) { console.log('[revealAnswer] getJSON request failed: ' + textStatus); })
        .always(function() { console.log('[revealAnswer] getJSON request ended!'); });
    });
};


const nextQuestion = () => {
    let questionArea = document.querySelector('.question');
    let questionID = document.querySelector('.question-id');
    let answerArea = document.querySelector('.answer');
    let btnNext = document.getElementById('btn-next');
    let btnPlay = document.getElementById('btn-play');

    btnNext.addEventListener('click', function() {
        var res;

        $.getJSON('/next', {}, function (data) {
            console.log("[nextQuestion] Request for the next Q&A");
            res = data[0];
        })
        .done(function() {
            questionArea.innerText = res.question;
            questionID.innerText = '#' + res.question_id;
            answerArea.innerText = '...';
            btnPlay.classList.remove('active');
            console.log("[nextQuestion] Found question: '" + res.question + "'");
        })
        .fail(function(jqXHR, textStatus, errorThrown) { console.log('[nextQuestion] getJSON request failed: ' + textStatus); })
        .always(function() { console.log('[nextQuestion] getJSON request ended!'); });
    });
};


const refreshMainUI = () => {
    quizBox.classList.add('active');
    tabMain.classList.add('active');
    tablebox.classList.remove('active');
    tabList.classList.remove('active');

    window.history.replaceState(null, null, rootURL);
};


const refreshListUI = () => {
    quizBox.classList.remove('active');
    tabMain.classList.remove('active');
    tablebox.classList.add('active');
    tabList.classList.add('active');

    updateURLParams();

    if (pagination.reload == false) {
        getSentenceList(pagination.currentPage, pagination.filterKeyword);
        pagination.reload = true;
    }
};


const updateURLParams = () => {
    newURL = new URL(rootURL);
    newURL.searchParams.set('page', pagination.currentPage);

    if (pagination.filterKeyword != '') {
        newURL.searchParams.set('keyword', pagination.filterKeyword);
    }

    window.history.replaceState(null, null, newURL);
}


const getPageCount = (keyword='') => {
    var res;

    $.getJSON('/count', {keyword:keyword}, function (data) {
        console.log("[getPageCount] Get the number of sentences");
        res = data[0];
    })
    .done(function() {
        let pageCount = Math.ceil(res.count / pagination.paginationLimit);
        pagination.pageCount = pageCount;
        pagination.initPage();

        document.querySelector(".total-pages").innerText = pageCount;
    })
    .fail(function(jqXHR, textStatus, errorThrown) { console.log('[getPageCount] getJSON request failed: ' + textStatus); })
    .always(function() { console.log('[getPageCount] getJSON request ended!'); });
}


const postData = async (url = '', data = {}) => {
    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    });

    return response.json();
};


const createSentece = () => {
    let question = document.getElementById('input-create-s1').value;
    let answer = document.getElementById('input-create-s2').value;

    postData('/create',
    {
        translated:question,
        original:answer
    })
    .then(data => {
        console.log(
            "[createSentece] Create new question (" +
            data.original + " ->" + data.translated + ")"
        );
        showBackground();
        document.getElementById('popup-create').classList.remove('active');
        pagination.initPage();
    })
    .catch(error => {
        console.log("[createSentece] fetch request failed: " + error);
    });
}


const searchSentece = () => {
    let keyword = document.getElementById('input-search').value;

    pagination = new Pagination(1, keyword);
    refreshListUI();

    showBackground();
    document.getElementById('popup-search').classList.remove('active');
}


const hideBackground = () => {
    main.classList.add('transparent');
}


const showBackground = () => {
    main.classList.remove('transparent');
}


const getSentenceList = (page, keyword='') => {
    var res;

    $.getJSON('/search', {page:page, keyword:keyword}, function (data) {
        console.log("[getSentenceList] Request for the table of sentences at page " + page);
        res = data;
    })
    .done(function() {
        let notFoundMsg = document.querySelector('.not-found');
        let dbtable = document.querySelector(".dbtable");
        const contents = dbtable.querySelector('tbody');

        Array.from(contents.querySelectorAll('tr')).forEach(function (item) {
            item.remove();
        });

        if (res.length == 0) {
            notFoundMsg.classList.add('active');
            dbtable.classList.remove('active');
            console.log("[getSentenceList] Have not found any sentences");

            return;
        }

        notFoundMsg.classList.remove('active');
        dbtable.classList.add('active');

        for (var i = 0; i < res.length; i++) {
            var record = res[i];

            let record_info = document.createElement("tr");

            record_info.innerHTML = '<td>' + (record.id + 1) + 
                '<button id="btn-delete"><svg class="ico-delete"></svg></button>' +
                '</td><td>' + record.translated +
                '<button id="btn-edit-1"><svg class="ico-edit"></svg></button>' +
                '</td><td>' + record.original +
                '<button id="btn-edit-2"><svg class="ico-edit"></svg></button>' +
                '</td>';

            contents.append(record_info);
        }

        console.log("[getSentenceList] Found the list of sentences: '#" + (res[0].id + 1) + " ~ #" + (res[0].id + res.length) + "'");
    })
    .fail(function(jqXHR, textStatus, errorThrown) { console.log('[getSentenceList] getJSON request failed: ' + textStatus); })
    .always(function() { console.log('[getSentenceList] getJSON request ended!'); });
}


document.addEventListener('DOMContentLoaded', function(){
    // tab
    tabMain.addEventListener('click', function() {
        refreshMainUI();
    });

    tabList.addEventListener('click', function() {
        refreshListUI();
    });

    // URL params
    const urlParams = new URLSearchParams(window.location.search);
    let ArgPage = urlParams.get('page');
    let ArgKeyword = urlParams.get('keyword');

    pagination = new Pagination(ArgPage, ArgKeyword);

    if (ArgPage != null) {
        refreshListUI();
    }

    // Reveal
    revealAnswer();

    // Next
    nextQuestion();

    // Play

    // Pagination
    let btnFirstPage = document.getElementById('btn-firstpage');
    let btnPrevPage = document.getElementById('btn-prevpage');
    let btnNextPage = document.getElementById('btn-nextpage');
    let btnLastPage = document.getElementById('btn-lastpage');

    btnFirstPage.addEventListener('click', function() {
        if (this.classList.contains('active')) 
            pagination.setFirstPage();
    });

    btnLastPage.addEventListener('click', function() {
        if (this.classList.contains('active')) 
            pagination.setLastPage();
    });

    btnPrevPage.addEventListener('click', function() {
        if (this.classList.contains('active')) 
            pagination.setCurrentPage(pagination.currentPage - 1);
    });

    btnNextPage.addEventListener('click', function() {
        if (this.classList.contains('active')) 
            pagination.setCurrentPage(pagination.currentPage + 1);
    });

    // Reset
    let btnReset = document.getElementById('btn-reset');

    btnReset.addEventListener('click', function() {
        pagination = new Pagination(1, '', recordsPerPage);
        refreshListUI();
    });

    // Create
    let btnAdd = document.getElementById('btn-add');

    btnAdd.addEventListener('click', function() {
        hideBackground();
        document.getElementById('popup-create').classList.add('active');
    });

    let btnConfirmAdd = document.querySelector('#popup-create #btn-confirm');
    
    btnConfirmAdd.addEventListener('click', function() {
        createSentece();
    });

    // Search
    let btnSearch = document.getElementById('btn-search');

    btnSearch.addEventListener('click', function() {
        hideBackground();
        document.getElementById('popup-search').classList.add('active');
    });

    let btnConfirmSearch = document.querySelector('#popup-search #btn-confirm');
    
    btnConfirmSearch.addEventListener('click', function() {
        searchSentece();
    });

    // Delete

    // Edit-1

    // Edit-2

    // Cancle
    const popUPs = document.querySelectorAll('.popup');
    const btnCancles = document.querySelectorAll('#btn-cancle');

    Array.from(btnCancles).forEach(function (btnCancle){
        btnCancle.addEventListener('click', function() {
            showBackground();

            Array.from(popUPs).forEach(function (popUP){
                popUP.classList.remove('active');
            });
        });
    });
});