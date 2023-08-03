'use strict'


const hideRightClick = window.addEventListener("contextmenu", e => e.preventDefault())
const gElModal = document.querySelector('.modal')
const gAudio = new Audio("sound/music.mp3")

var gBoard
var gLives
var gFlagLeft
var gTimeInterval
var isMoonToggled = false
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
    playNewLevelSound()
    clearInterval(gTimeInterval)
    gBoard = buildBoard()
    renderBoard(gBoard)
    gElModal.classList.add('hidden')
    gGame.isFirstClick = true
    gGame.secsPassed = 0
    gGame.isOn = true
    gFlagLeft = gLevel.MINES
    renderUI()
    countFlag()
    updateTimerDisplay()
    gTimeInterval = setInterval(updateTimer, 1000)
}

function buildBoard() {
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

function deployMines(row, col) {
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

function setMinesNegsCount(board) {
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

function renderBoard(board) {
    //DONE: Render the board as a <Table> to the page
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

function onCellClicked(elCell, i, j) {
    if (!gGame.isOn) return
    if (gGame.isFirstClick) deployMines(i, j)
    if (gBoard[i][j].isShown || gBoard[i][j].isMarked) return

    playExpandSound()
    gBoard[i][j].isShown = true
    gGame.shownCount++
    elCell.innerText = gBoard[i][j].isMine ? '💣' : gBoard[i][j].minesAroundCount

    if (gBoard[i][j].isMine) {
        updateFlag()
        gLevel.MINES--
        gLives--
        playDamageSound()

        const heartImg = document.querySelector(`.heart${gLives + 1}-img`)
        heartImg.src = "img/black-heart.png"
        if (gLives === 2) {
            const smileyImg = document.querySelector('.smiley-img')
            smileyImg.src = "img/hurt.png"
        }

        if (gLives === 1) {
            const smileyImg = document.querySelector('.smiley-img')
            smileyImg.src = "img/danger.png"
        }

        if (gLives === 0) {
            playLosingSound()
            const heartImg = document.querySelector(`.heart${gLives + 1}-img`)
            heartImg.src = "img/black-heart.png"
            gGame.isOn = false
            msg('Game Over!, Click me to Respawn')
            clearInterval(gTimeInterval)
            revealMines()
            const smileyImg = document.querySelector('.smiley-img')
            smileyImg.src = "img/dead.png"
        }
    }

    if (gBoard[i][j].minesAroundCount === 0) {
        //DONE:Expand all the neighbors 
        expandShown(gBoard, elCell, i, j)
    }
    checkGameOver()
}

function onCellMarked(elCell, i, j) {
    if (!gGame.isOn) return
    if (gBoard[i][j].isShown) return
    playExpandSound()
    gBoard[i][j].isMarked = !gBoard[i][j].isMarked

    if (gBoard[i][j].isMarked) {
        if (gFlagLeft === 0) return
        elCell.innerText = '🚩'
        gGame.markedCount++
        updateFlag()
    } else {
        elCell.innerText = '🟦'
        gGame.markedCount--
        addFlag()
    }
    console.log(gGame)

    checkGameOver()
}

function checkGameOver() {
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

function expandShown(board, elCell, i, j) {

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
    checkGameOver()
}

function revealMines() {
    for (var i = 0; i < gLevel.SIZE; i++) {
        for (var j = 0; j < gLevel.SIZE; j++) {
            if (gBoard[i][j].isMine) {
                const elCell = document.querySelector(`.cell-${i}-${j}`)
                elCell.innerText = '💣'
            }
        }
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

function addFlag() {
    gFlagLeft++
    countFlag()
}

function countFlag() { // dom
    const elFlagLeft = document.querySelector('.flag-count')
    elFlagLeft.innerText = gFlagLeft
}

function msg(text) {
    gElModal.classList.remove('hidden')
    gElModal.innerText = text
}

function showHelp() {
    const elHelp = document.querySelector('.instruction')
    elHelp.classList.toggle('hidden')
}

function renderUI() {
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

function darkMode() {
    const elImg = document.querySelector('.smiley img')
    elImg.classList.toggle('border')
    document.body.classList.toggle('dark-mode')
}

function onEasy() {
    onInit('easy')
}

function onMedium() {
    onInit('medium')
}

function onHard() {
    onInit('hard')
}

function onRestart() {
    window.location.reload()
}

function toggleMoon(moon) {
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