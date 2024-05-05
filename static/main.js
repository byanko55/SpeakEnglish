const header = document.getElementById('header');
const main = document.getElementById('main');
let pagination;


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


const resetPage = () => {
    let btnReset = document.getElementById('btn-reset');

    btnReset.addEventListener('click', function() {
        initPagination(1, 15);
        getSentenceList(1);
    });
}


const getSentenceList = (page) => {
    var res;

    $.getJSON('/search', {page:page}, function (data) {
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


const initPagination = (page, limit) => {
    var res;

    $.getJSON('/count', {}, function (data) {
        console.log("[initPagination] Get the number of sentences");
        res = data[0];
    })
    .done(function() {
        pagination = new Pagination(page, limit, res.count);
        pagination.setCurrentPage(page);

        const url = new URL(window.location.href);
        url.searchParams.set('page', page);

        window.history.replaceState(null, null, url);
    })
    .fail(function(jqXHR, textStatus, errorThrown) { console.log('[initPagination] getJSON request failed: ' + textStatus); })
    .always(function() { console.log('[initPagination] getJSON request ended!'); });
};


class Pagination{
    constructor(page, limit, numRecords) {
        this.currentPage = page;
        this.paginationLimit = limit;
        this.pageCount = Math.ceil(numRecords / limit);

        document.getElementById("input-page").value = page;
        document.querySelector(".total-pages").innerText = this.pageCount;
    }

    disableButton(button){
        button.classList.remove("active");
    };
    
    enableButton(button){
        button.classList.add("active");
    };
    
    setCurrentPage(page){
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
    };
}


document.addEventListener('DOMContentLoaded', function(){
    let quizBox = document.querySelector('.quizbox');
    let tablebox = document.querySelector('.tablebox');

    let lastPage = 1;
    let lastKeyword = '';

    // tab
    let tabMain = document.getElementById('link-main');
    let tabList = document.getElementById('link-list');

    const refreshMainUI = () => {
        quizBox.classList.add('active');
        tabMain.classList.add('active');
        tablebox.classList.remove('active');
        tabList.classList.remove('active');
    };
    
    const refreshListUI = () => {
        quizBox.classList.remove('active');
        tabMain.classList.remove('active');
        tablebox.classList.add('active');
        tabList.classList.add('active');
    };

    tabMain.addEventListener('click', function() {
        refreshMainUI();
    });

    tabList.addEventListener('click', function() {
        refreshListUI();
    });

    // URL params
    const urlParams = new URLSearchParams(window.location.search);

    if (urlParams.has('page')){
        refreshListUI();

        lastPage = urlParams.get('page');
        getSentenceList(lastPage);
        initPagination(lastPage, 15);
    }

    // Reveal
    revealAnswer();

    // Next
    nextQuestion();

    // Play

    // Reset
    resetPage();

    // Add

    // Search

    // Delete

    // Edit-1

    // Edit-2
});