'use strict'

const hideRightClick = window.addEventListener("contextmenu", e => e.preventDefault())
const gElModal = document.querySelector('.modal')
const gAudio = new Audio("sound/music.mp3")

var gBoard
var gSavedBoards = [] // for undo
var gLives
var gFlagLeft
var gTimeInterval
var isMoonToggled = false // for darkmode
var isMusicPlaying = false

var gLevel = {
    SIZE: 4,
    MINES: 2
}

var gGame = {
    isOn: false,
    shownCount: 0,
    markedCount: 0,
    secsPassed: 0,
    isFirstClick: true
}

function onInit(level = 'medium') {
    if (level === 'easy') {
        gLevel = {
            SIZE: 4,
            MINES: 2
        }
        gLives = 1;
    } else if (level === 'medium') {
        gLevel = {
            SIZE: 8,
            MINES: 14
        }
        gLives = 3;
    } else if (level === 'hard') {
        gLevel = {
            SIZE: 12,
            MINES: 32
        };
        gLives = 3
    }
    playNewLevelSound() //sound for every new game
    clearInterval(gTimeInterval) //stop timer from last round
    gBoard = buildBoard() // build the board for the model
    renderBoard(gBoard) //render the board to the user (DOM)
    gElModal.classList.add('hidden') // hide modal every new game
    gGame.isFirstClick = true // first click never will be mine
    gGame.secsPassed = 0 // restart the timer
    gGame.isOn = true
    gFlagLeft = gLevel.MINES //flags counting the mines
    renderUI() // render the smiley expressions / hearts according to the life amount
    countFlag() // to the DOM
    updateTimerDisplay() // to the DOM
    gTimeInterval = setInterval(updateTimer, 1000) //start the timer every new game
}

function buildBoard() { // building the board for the model
    const board = []
    for (var i = 0; i < gLevel.SIZE; i++) {
        board[i] = []
        for (var j = 0; j < gLevel.SIZE; j++) {
            board[i][j] = {
                minesAroundCount: 0,
                isShown: false,
                isMine: false,
                isMarked: false
            }
        }
    }

    return board
}

function deployMines(row, col) { //function that Im using only after the first click
    var minesAmount = gLevel.MINES
    while (minesAmount > 0) {
        const randRow = getRandomInt(0, gLevel.SIZE)
        const randCol = getRandomInt(0, gLevel.SIZE)
        if (!gBoard[randRow][randCol].isMine && (randRow !== row || randCol !== col)) {
            gBoard[randRow][randCol].isMine = true
            minesAmount--
        }
    }
    gGame.isFirstClick = false
    setMinesNegsCount(gBoard)
}

function setMinesNegsCount(board) { // checks for the mines near the clicked cell
    for (var rowIdx = 0; rowIdx < board.length; rowIdx++) {
        for (var colIdx = 0; colIdx < board[rowIdx].length; colIdx++) {
            var mineCount = 0
            for (var i = rowIdx - 1; i <= rowIdx + 1; i++) {
                if (i < 0 || i >= board.length) continue
                for (var j = colIdx - 1; j <= colIdx + 1; j++) {
                    if (i === rowIdx && j === colIdx) continue
                    if (j < 0 || j >= board[0].length) continue
                    // console.log(`board[${i}][${j}]`, board[i][j])
                    var currCell = board[i][j]
                    if (currCell.isMine) {
                        mineCount++
                    }
                }
            }
            board[rowIdx][colIdx].minesAroundCount = mineCount
        }
    }
}

function renderBoard(board) { // render the board for the user (DOM)
    var strHTML = ''
    for (var i = 0; i < gLevel.SIZE; i++) {
        strHTML += '<tr>'
        for (var j = 0; j < gLevel.SIZE; j++) {

            const cell = board[i][j]
            const className = `cell cell-${i}-${j}`
            var cellContent = '🟦'
            if (!cell.isShown) {
                strHTML += `<td class="${className}" onclick="onCellClicked(this, ${i}, ${j})" oncontextmenu="onCellMarked(this,  ${i}, ${j})">${cellContent}</td>`
            } else {
                if (cell.isMine) {
                    strHTML += `<td class="${className} mine">💣</td>`
                } else {
                    strHTML += `<td class="${className}">${cell.minesAroundCount}</td>`
                }
            }
        }
        strHTML += '</tr>'
    }
    const elContainer = document.querySelector('.board')
    elContainer.innerHTML = strHTML
}

function boardCopy(board) { // copy the current board to use that for undo function
    var copy = []
    for (var i = 0; i < board.length; i++) {
        copy[i] = []
        for (var j = 0; j < board[i].length; j++) {
            var cell = board[i][j]
            copy[i][j] = {
                minesAroundCount: cell.minesAroundCount,
                isShown: cell.isShown,
                isMine: cell.isMine,
                isMarked: cell.isMarked
            }
        }
    }
    return copy
}

function onCellClicked(elCell, i, j) { // the heart of the code // every interaction that the user do 
    if (!gGame.isOn) return
    if (gGame.isFirstClick) deployMines(i, j) // after first click its deploy mines
    if (gBoard[i][j].isShown || gBoard[i][j].isMarked) return

    playExpandSound()
    gBoard[i][j].isShown = true
    gGame.shownCount++
    elCell.innerText = gBoard[i][j].isMine ? '💣' : gBoard[i][j].minesAroundCount

    if (gBoard[i][j].isMine) {
        updateFlag() // make its decrease
        gLevel.MINES--
        gLives--
        playDamageSound()

        const heartImg = document.querySelector(`.heart${gLives + 1}-img`) //every time the user click on mine 1 heart will be black
        heartImg.src = "img/black-heart.png"
        if (gLives === 2) {
            const smileyImg = document.querySelector('.smiley-img')
            smileyImg.src = "img/hurt.png" // another face to the smiley according the lives left
        }

        if (gLives === 1) {
            const smileyImg = document.querySelector('.smiley-img')
            smileyImg.src = "img/danger.png" // another face to the smiley according the lives left
        }

        if (gLives === 0) {
            playLosingSound()
            const heartImg = document.querySelector(`.heart${gLives + 1}-img`)
            heartImg.src = "img/black-heart.png"
            gGame.isOn = false // stop the game
            msg('Game Over!, Click me to Respawn') // the user get a msg from the smiley
            clearInterval(gTimeInterval) // stop timer
            revealMines() // show all the mines after the game over
            const smileyImg = document.querySelector('.smiley-img')
            smileyImg.src = "img/dead.png" // another face to the smiley according his death
        }
    }

    if (gBoard[i][j].minesAroundCount === 0) { // if the user click on empty cell its gonna expand further
        expandShown(gBoard, elCell, i, j)
    }
    gSavedBoards.push(boardCopy(gBoard)) // saving the last board to copy
    checkWin()
}

function onCellMarked(elCell, i, j) {
    if (!gGame.isOn) return
    if (gBoard[i][j].isShown) return
    playExpandSound()
    gBoard[i][j].isMarked = !gBoard[i][j].isMarked //toggle

    if (gBoard[i][j].isMarked) {
        if (gFlagLeft === 0) return
        elCell.innerText = '🚩'
        gGame.markedCount++
        updateFlag() // decrease the flag count
    } else {
        elCell.innerText = '🟦'
        gGame.markedCount--
        addFlag() // increase back the flag count
    }
    console.log(gGame)

    gSavedBoards.push(boardCopy(gBoard)) // saving the last board to copy
    checkWin()
}

function checkWin() { // checking if the user win
    const totalCells = gLevel.SIZE * gLevel.SIZE
    const totalMines = gLevel.MINES

    if (gGame.markedCount === totalMines && gGame.shownCount === totalCells - totalMines) {
        msg('YOU WIN!')
        clearInterval(gTimeInterval)
        playWinningSound()
        const smileyImg = document.querySelector('.smiley-img')
        smileyImg.src = "img/cool.png"
    }

}

function expandShown(board, elCell, i, j) { // try to expand further if its empty cell (elCell is not just unused, in the recursion he's gonna be elNeighborCell)

    if (gBoard[i][j].isMine) return

    for (var rowIdx = i - 1; rowIdx <= i + 1; rowIdx++) {
        if (rowIdx < 0 || rowIdx >= board.length) continue

        for (var colIdx = j - 1; colIdx <= j + 1; colIdx++) {
            if (colIdx < 0 || colIdx >= board[0].length) continue
            if (rowIdx === i && colIdx === j) continue

            var currCell = board[rowIdx][colIdx]


            if (!currCell.isShown && !currCell.isMarked) {
                currCell.isShown = true
                gGame.shownCount++

                var elNeighborCell = document.querySelector(`.cell-${rowIdx}-${colIdx}`)
                elNeighborCell.innerText = currCell.isMine ? '💣' : currCell.minesAroundCount

                if (currCell.minesAroundCount === 0) {
                    expandShown(board, elNeighborCell, rowIdx, colIdx)
                }
            }
        }
    }
    checkWin()
}

function revealMines() { // make the mines reveal after the user dead
    for (var i = 0; i < gLevel.SIZE; i++) {
        for (var j = 0; j < gLevel.SIZE; j++) {
            if (gBoard[i][j].isMine) {
                const elCell = document.querySelector(`.cell-${i}-${j}`)
                elCell.innerText = '💣'
            }
        }
    }
}

function makeUndo() { 
    if (gSavedBoards.length === 0) return
    gSavedBoards.pop() // to pop the same current board
    if (gSavedBoards.length > 0) {
        gBoard = boardCopy(gSavedBoards[gSavedBoards.length - 1]) // gBoard gonna be the last saved board (model)
        renderBoard(gBoard) // DOM
    }
}

function updateTimer() { //model
    gGame.secsPassed++
    updateTimerDisplay()
}

function updateTimerDisplay() { //DOM
    const elTimer = document.querySelector('.timer')
    elTimer.innerText = `${gGame.secsPassed}🕒`
}

function updateFlag() { //model
    gFlagLeft--
    countFlag()
}

function addFlag() { // model
    gFlagLeft++
    countFlag()
}

function countFlag() { // dom
    const elFlagLeft = document.querySelector('.flag-count')
    elFlagLeft.innerText = gFlagLeft
}

function msg(text) { // print the user msg
    gElModal.classList.remove('hidden')
    gElModal.innerText = text
}

function showHelp() { // just a instruction center 
    const elHelp = document.querySelector('.instruction')
    elHelp.classList.toggle('hidden')
}

function renderUI() { // render the hearts according the lives (and the first smiley)
    const smileyImg = document.querySelector('.smiley-img')
    smileyImg.src = "img/happy.png"

    const heartImg = document.querySelector(`.heart1-img`)
    const heartImg2 = document.querySelector(`.heart2-img`)
    const heartImg3 = document.querySelector(`.heart3-img`)


    if (gLives === 1) {
        heartImg.src = "img/red-heart.png"
        heartImg2.style.display = 'none'
        heartImg3.style.display = 'none'
    } else {
        heartImg.src = "img/red-heart.png"
        heartImg2.src = "img/red-heart.png"
        heartImg3.src = "img/red-heart.png"
        heartImg2.style.display = 'inline'
        heartImg3.style.display = 'inline'
    }
}

function darkMode() { // dark mode features
    const elTimer = document.querySelector('.timer')
    const elImg = document.querySelector('.smiley img')
    elImg.classList.toggle('border')
    elTimer.style.color = 'white'
    document.body.classList.toggle('dark-mode')
}

function onEasy() { // for the difficulties buttons
    onInit('easy')
}

function onMedium() {
    onInit('medium')
}

function onHard() {
    onInit('hard')
}

function onRestart() { // for the click on the smiley (I found this to be the most efficient way without adding unnecessary bugs)
    window.location.reload()
}

function toggleMoon(moon) { // some fancy Design according to the situation
    if (isMoonToggled) {
        moon.innerText = '🌔'
    } else {
        moon.innerText = '🌒'
    }
    isMoonToggled = !isMoonToggled
}

//-----------------MUSIC-------------------

function toggleMusic() {
    const playButton = document.querySelector('.play')

    if (!isMusicPlaying) {
        gAudio.loop = true
        gAudio.play()
        playButton.innerText = '⏸️'
    } else {
        gAudio.pause()
        playButton.innerText = '▶️'
    }
    isMusicPlaying = !isMusicPlaying
}

function playDamageSound() {
    const sound = new Audio('sound/damage.mp3')
    sound.play()
}

function playLosingSound() {
    const sound = new Audio('sound/lose.mp3')
    sound.play()
}

function playExpandSound() {
    const sound = new Audio('sound/expand.wav')
    sound.play()
}

function playNewLevelSound() {
    const sound = new Audio('sound/new-game.wav')
    sound.play()
}

function playWinningSound() {
    const sound = new Audio('sound/winning.wav')
    sound.play()
}