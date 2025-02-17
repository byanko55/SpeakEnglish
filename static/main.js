const main = document.getElementById('main');
const quizBox = document.querySelector('.quizbox');
const tablebox = document.querySelector('.tablebox');
const tabMain = document.getElementById('link-main');
const tabList = document.getElementById('link-list');
const recordsPerPage = 15;

let pagination;
var sid;
const rootURL = (window.location.href).split("?")[0];


class Pagination{
    constructor(page, keyword, limit = 15) {
        this.currentPage = (page == null) ? 1 : Number(page);
        this.filterKeyword = (keyword == null) ? '' : keyword;
        this.paginationLimit = limit;
        this.pageCount = 0;
        this.reload = false;

        if (page != -1) {
            document.getElementById("input-page").value = this.currentPage;
        }

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


const sendHTTPRequest = async (url = '', method, data = {}) => {
    if (method == 'GET'){
        const response = await fetch(url, {
            method: 'GET'
        });
    
        return response.json();
    }
    else {
        const response = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });
    
        return response.json();
    }
}


const getPageCount = (keyword='') => {
    sendHTTPRequest(`/count?keyword=${keyword}`, 'GET', {})
    .then(data => {
        let pageCount = Math.max(Math.ceil(data.count / pagination.paginationLimit), 1);
        pagination.pageCount = pageCount;

        if (pagination.currentPage == -1) {
            document.getElementById("input-page").value = pageCount;
            pagination.setLastPage();
        }
        else {
            pagination.initPage();
        }

        document.querySelector(".total-pages").innerText = pageCount;
    })
    .catch(error => {
        console.log("[getPageCount] request failed: " + error);
    });
}


const createSentece = () => {
    let question = document.getElementById('input-create-s1').value;
    let answer = document.getElementById('input-create-s2').value;

    sendHTTPRequest('/create', 'POST',
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
        pagination = new Pagination(-1, '');
    })
    .catch(error => {
        console.log("[createSentece] request failed: " + error);
    });
}


const searchSentece = () => {
    let keyword = document.getElementById('input-search').value;

    pagination = new Pagination(1, keyword);
    refreshListUI();

    showBackground();
    document.getElementById('popup-search').classList.remove('active');
}


const deleteSentence = (sentenceId) => {
    if (! isInteger(sentenceId)){
        window.location.replace("404.html");
    }

    sendHTTPRequest('/delete', 'DELETE',
    {
        id:Number(sentenceId)
    })
    .then(data => {
        console.log("[deleteSentence] Delete a question ID: " + sentenceId);
        showBackground();
        document.getElementById('popup-delete').classList.remove('active');
        pagination.initPage();
    })
    .catch(error => {
        console.log("[deleteSentence] request failed: " + error);
    });
}


const editSentence = (sentenceId, IsQuestion) => {
    if (! isInteger(sentenceId)){
        window.location.replace("404.html");
    }

    let keyword;
    
    if (IsQuestion){
        keyword = document.getElementById('input-edit-1').value;
    }
    else {
        keyword = document.getElementById('input-edit-2').value;
    }

    sendHTTPRequest('/edit', 'PUT',
    {
        id:Number(sentenceId),
        new_content: keyword,
        is_question: IsQuestion
    })
    .then(data => {
        console.log("[editSentence] Edit a question ID: " + sentenceId);
        showBackground();

        if (IsQuestion){
            document.getElementById('popup-edit-1').classList.remove('active');
        }
        else {
            document.getElementById('popup-edit-2').classList.remove('active');
        }

        pagination.initPage();
    })
    .catch(error => {
        console.log("[editSentence] fetch request failed: " + error);
    });
}


const hideBackground = () => {
    main.classList.add('transparent');
}


const showBackground = () => {
    main.classList.remove('transparent');
}


const getSentenceList = (page, keyword='') => {
    let url = `search?page=${page}`;

    if (keyword != '') url = url + `&keyword=${keyword}`;

    console.log("[getSentenceList] Request for the table of sentences at page " + page);

    sendHTTPRequest(url, 'GET', {})
    .then(data => {
        let notFoundMsg = document.querySelector('.not-found');
        let dbtable = document.querySelector(".dbtable");
        const contents = dbtable.querySelector('tbody');

        Array.from(contents.querySelectorAll('tr')).forEach(function (item) {
            item.remove();
        });

        if (data.length == 0) {
            notFoundMsg.classList.add('active');
            dbtable.classList.remove('active');
            console.log("[getSentenceList] Have not found any sentences");

            return;
        }

        notFoundMsg.classList.remove('active');
        dbtable.classList.add('active');

        for (var i = 0; i < data.length; i++) {
            var record = data[i];

            let record_info = document.createElement("tr");

            record_info.innerHTML = '<td>' + (record.id) + 
                '<button id="btn-delete" sid=' + (record.id) + 
                '><svg class="ico-delete"></svg></button>' +
                '</td><td>' + record.translated +
                '<button id="btn-edit-1" sid=' + (record.id) + 
                '><svg class="ico-edit"></svg></button>' +
                '</td><td>' + record.original +
                '<button id="btn-edit-2" sid=' + (record.id) + 
                '><svg class="ico-edit"></svg></button>' +
                '</td>';

            contents.append(record_info);
        }

        EnableButtons();

        console.log("[getSentenceList] Found the list of sentences: '#" + (data[0].id) + " ~ #" + (data[0].id + data.length - 1) + "'");
    })
    .catch(error => {
        console.log("[getSentenceList] request failed: " + error);
    });
}


const EnableButtons = () => {
    // Delete
    const btnDeletes = document.querySelectorAll('#btn-delete');

    Array.from(btnDeletes).forEach(function (btnDelete){
        btnDelete.addEventListener('click', function(){
            hideBackground();
            document.getElementById('popup-delete').classList.add('active');
            sid = btnDelete.getAttribute("sid");

            document.querySelectorAll('.sentence-id').forEach(id => {
                id.innerText = Number(sid) + 1;
            });
        });
    });

    // Edit
    const btnEdits = document.querySelectorAll('#btn-edit-1, #btn-edit-2');

    Array.from(btnEdits).forEach(function (btnEdit){
        btnEdit.addEventListener('click', function(){
            hideBackground();

            if (btnEdit.id == 'btn-edit-1'){
                document.getElementById('popup-edit-1').classList.add('active');
            }
            else {
                document.getElementById('popup-edit-2').classList.add('active');
            }

            sid = btnEdit.getAttribute("sid");

            document.querySelectorAll('.sentence-id').forEach(id => {
                id.innerText = Number(sid) + 1;
            });
        });
    });
}


const playAnswer = (answer) => {
    console.log("[playAnswer] Perform the text-to-speech request for the answer: " + answer);

    sendHTTPRequest(`/play?text=${answer}`, 'GET', {})
    .then(data => {
        var audioFile = new Audio();

        let audioBlob = base64ToBlob(data.raw, "mp3");
        audioFile.src = window.URL.createObjectURL(audioBlob);
        audioFile.playbackRate = 1;
        audioFile.play();
    })
    .catch(error => {
        console.log("[playAnswer] request failed: " + error);
    });
}


const base64ToBlob = (base64, fileType) => {
    let typeHeader = "data:application/" + fileType + ";base64,";
    let audioSrc = typeHeader + base64; 
    let arr = audioSrc.split(",");
    let array = arr[0].match(/:(.*?);/);
    let mime = (array && array.length > 1 ? array[1] : type) || type;

    let bytes = window.atob(arr[1]);
    let ab = new ArrayBuffer(bytes.length);
    let ia = new Uint8Array(ab);

    for (let i = 0; i < bytes.length; i++) {
        ia[i] = bytes.charCodeAt(i);
    }

    return new Blob([ab], {
        type: mime
    });
}


const downloadSentence = () => {
    let url = `export`;

    console.log("[downloadSentence] Download the table of sentences");

    let filename = "English.csv";

    fetch(url, {
        method: 'GET',
        headers: {
            'content-type': 'text/csv;charset=UTF-8'
        }
    })
    .then((response) => response.text())
    .then((responseText) => {
        const blob = new Blob(['\ufeff' + responseText], { type: 'text/csv' });
        const downloadURL = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.setAttribute('href', downloadURL);
        a.setAttribute('download', filename);
        a.click();
    })
    .catch(error => {
        console.log("[downloadSentence] request failed: " + error);
    });
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
    let questionArea = document.querySelector('.question');
    let answerArea = document.querySelector('.answer');
    let btnReveal = document.getElementById('btn-reveal');
    let btnPlay = document.getElementById('btn-play');

    btnReveal.addEventListener('click', function() {
        console.log("[revealAnswer] Request for the original sentence  before being translated: '" + questionArea.innerText + "'");

        sendHTTPRequest(`/reveal`, 'GET', {})
        .then(data => {
            answerArea.innerText = data.answer;
            btnPlay.classList.add('active');
            console.log("[revealAnswer] Found answer: '" + data.answer + "'");
        })
        .catch(error => {
            console.log("[revealAnswer] request failed: " + error);
        });
    });

    // Next
    let questionID = document.querySelector('.question-id');
    let btnNext = document.getElementById('btn-next');

    btnNext.addEventListener('click', function() {
        console.log("[nextQuestion] Request for the next Q&A");

        sendHTTPRequest(`/next`, 'GET', {})
        .then(data => {
            questionArea.innerText = data.question;
            questionID.innerText = '#' + data.question_id;
            answerArea.innerText = '...';
            btnPlay.classList.remove('active');
            console.log("[nextQuestion] Found question: '" + data.question + "'");
        })
        .catch(error => {
            console.log("[nextQuestion] request failed: " + error);
        });
    });

    // Play
    btnPlay.addEventListener('click', function() {
        let answer = document.querySelector('.answer').innerText;

        playAnswer(answer);
    });

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

    // Pop-ups
    const popUPs = document.querySelectorAll('.popup');

    // Reset
    let btnReset = document.getElementById('btn-reset');

    btnReset.addEventListener('click', function() {
        pagination = new Pagination(1, '', recordsPerPage);
        refreshListUI();
    });

    // Create
    const btnAdd = document.getElementById('btn-add');

    btnAdd.addEventListener('click', function() {
        hideBackground();
        document.getElementById('popup-create').classList.add('active');
    });

    const btnConfirmAdd = document.querySelector('#popup-create #btn-confirm');
    
    btnConfirmAdd.addEventListener('click', function() {
        createSentece();
    });

    // Search
    const btnSearch = document.getElementById('btn-search');

    btnSearch.addEventListener('click', function() {
        hideBackground();
        document.getElementById('popup-search').classList.add('active');
    });

    const btnConfirmSearch = document.querySelector('#popup-search #btn-confirm');
    
    btnConfirmSearch.addEventListener('click', function() {
        searchSentece();
    });
    
    // Delete
    const btnConfirmDelete = document.querySelector('#popup-delete #btn-confirm');
    
    btnConfirmDelete.addEventListener('click', function() {
        deleteSentence(sid);
    });

    // Edit-1
    const btnConfirmEditQuestion = document.querySelector('#popup-edit-1 #btn-confirm');
    
    btnConfirmEditQuestion.addEventListener('click', function() {
        editSentence(sid, IsQuestion=true);
    });

    // Edit-2
    const btnConfirmEditAnswer = document.querySelector('#popup-edit-2 #btn-confirm');
    
    btnConfirmEditAnswer.addEventListener('click', function() {
        editSentence(sid, IsQuestion=false);
    });

    // Cancle
    const btnCancles = document.querySelectorAll('#btn-cancle');

    Array.from(btnCancles).forEach(function (btnCancle){
        btnCancle.addEventListener('click', function() {
            showBackground();

            Array.from(popUPs).forEach(function (popUP){
                popUP.classList.remove('active');
            });
        });
    }); 

    // Export
    const btnExportSentences = document.querySelector('#btn-export');
    
    btnExportSentences.addEventListener('click', function() {
        downloadSentence();
    });
});