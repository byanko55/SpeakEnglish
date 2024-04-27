const header = document.getElementById('header');
const main = document.getElementById('main');


const revealAnswer = () => {
    let questionArea = document.querySelector('.question');
    let answerArea = document.querySelector('.answer');
    let btnReveal = document.getElementById('btn-reveal');

    btnReveal.addEventListener('click', function() {
        var res;

        $.getJSON('/reveal', {}, function (data) {
            console.log("[revealAnswer] Request for the original sentence  before being translated: '" + questionArea.innerText + "'");
            res = data[0];
        })
        .done(function() {
            answerArea.innerText = res.answer;
            console.log("[revealAnswer] Found answer: '" + res.answer + "'");
        })
        .fail(function(jqXHR, textStatus, errorThrown) { console.log('[revealAnswer] getJSON request failed: ' + textStatus); })
        .always(function() { console.log('[revealAnswer] getJSON request ended!'); });
    });
};


document.addEventListener('DOMContentLoaded', function(){
    let quizBox = document.querySelector('.quizbox');
    let dbTable = document.querySelector('.dbtable');

    // tab
    let tabMain = document.getElementById('link-main');
    let tabList = document.getElementById('link-list');

    tabMain.addEventListener('click', function() {
        quizBox.classList.add('active');
        tabMain.classList.add('active');
        dbTable.classList.remove('active');
        tabList.classList.remove('active');
    });

    tabList.addEventListener('click', function() {
        quizBox.classList.remove('active');
        tabMain.classList.remove('active');
        dbTable.classList.add('active');
        tabList.classList.add('active');
    });

    // Reveal
    revealAnswer();

    // Next

    // Play

    // Pagination

    // Reset

    // Add

    // Search

    // Delete

    // Edit-1

    // Edit-2
});