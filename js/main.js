'use strict'

//DONE: Make the game understand the user can win even if he step on mine (lives > 0)
//TODO: If clicked on mine dont expand!

const hideRightClick = window.addEventListener("contextmenu", e => e.preventDefault())

var gBoard
var lives = 3

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


function onInit() {
    gBoard = buildBoard()
    renderBoard(gBoard)
    gGame.isOn = true
    hideRightClick

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

    gBoard[i][j].isShown = true
    gGame.shownCount++
    elCell.innerText = gBoard[i][j].isMine ? '💣' : gBoard[i][j].minesAroundCount

    if (gBoard[i][j].isMine) {
        gLevel.MINES--
        lives--
        
        const heartImg = document.querySelector(`.heart${lives + 1}-img`)
        heartImg.src = "img/black-heart.png"
        if (lives === 0) {
            const heartImg = document.querySelector(`.heart${lives + 1}-img`)
            heartImg.src = "img/black-heart.png"
            gGame.isOn = false
            console.log('Game Over! You clicked a mine!')
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

    gBoard[i][j].isMarked = !gBoard[i][j].isMarked

    if (gBoard[i][j].isMarked) {
        elCell.innerText = '🚩'
        gGame.markedCount++
    } else {
        elCell.innerText = '🟦'
        gGame.markedCount--
    }
    console.log(gGame)

    checkGameOver()
}

function checkGameOver() {
    const totalCells = gLevel.SIZE * gLevel.SIZE
    const totalMines = gLevel.MINES

    if(gGame.markedCount === totalMines) {
        if(gGame.markedCount + gGame.shownCount === totalCells) {
            console.log('YOU WIN!')
            const smileyImg = document.querySelector('.smiley-img')
            smileyImg.src = "img/cool.png"
        }
    }

}

function expandShown(board, elCell, i, j) {  //elCell will be activated in the recursion (elNeighborCell), its not just offline!
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

