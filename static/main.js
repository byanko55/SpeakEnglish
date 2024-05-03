const header = document.getElementById('header');
const main = document.getElementById('main');


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
    
            //console.log(record);
        }

        console.log("[getSentenceList] Found the list of sentences: '#" + (res[0].id + 1) + " ~ #" + (res[0].id + res.length) + "'");
    })
    .fail(function(jqXHR, textStatus, errorThrown) { console.log('[getSentenceList] getJSON request failed: ' + textStatus); })
    .always(function() { console.log('[getSentenceList] getJSON request ended!'); });
}


document.addEventListener('DOMContentLoaded', function(){
    let quizBox = document.querySelector('.quizbox');
    let tablebox = document.querySelector('.tablebox');

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

        const url = new URL(window.location.href);
        url.searchParams.set('page', '1');

        window.history.replaceState(null, null, url);
    });

    // URL params
    const urlParams = new URLSearchParams(window.location.search);

    if (urlParams.has('page')){
        refreshListUI();
        getSentenceList(urlParams.get('page'));
    }

    // Reveal
    revealAnswer();

    // Next
    nextQuestion();

    // Play

    // Pagination

    // Reset

    // Add

    // Search

    // Delete

    // Edit-1

    // Edit-2
});