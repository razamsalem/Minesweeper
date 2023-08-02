'use strict'

var gBoard

var gLevel = {
    SIZE: 4,
    MINES: 2
}

var gGame = {
    isOn: false,
    shownCount: 0,
    markedCount: 0,
    secsPassed: 0
}


function onInit() {
    gBoard = buildBoard()
    console.log(gBoard)
    setMinesNegsCount(gBoard)
    renderBoard(gBoard)
}

function buildBoard() {
    const board = []
    for (var i = 0; i < 4; i++) {
        board[i] = []
        for (var j = 0; j < 4; j++) {
            board[i][j] = {
                minesAroundCount: 0,
                isShown: false,
                isMine: false,
                isMarked: false
            }
        }
    }

    // for (var i = 0; i < 1; i++) {
    //     const randRow = getRandomInt(0, 4)
    //     const randRow2 = getRandomInt(0, 4)
    //     for (var j = 0; j < 1; j++) {
    //         const randCol = getRandomInt(0, 4)
    //         const randCol2 = getRandomInt(0, 4)
    //         board[randRow][randCol].isMine = true
    //         board[randRow2][randCol2].isMine = true
    //     }
    // }

    board[1][1].isMine = true
    board[2][3].isMine = true

    return board
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
    for (var i = 0; i < board.length; i++) {
        strHTML += '<tr>'
        for (var j = 0; j < board[0].length; j++) {

            const cell = board[i][j]
            const className = `cell cell-${i}-${j}`
            var cellContent = '🟦'
            if (!cell.isShown) {
                strHTML += `<td class="${className}" onclick="onCellClicked(this, ${i}, ${j})" >${cellContent}</td>`
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
    //DONE : Called when a cell is clicked
    console.log('check')
    console.log('cell:', elCell, i, j)

    if (gBoard[i][j].isShown || gBoard[i][j].isMarked) {
        return
    }
    gBoard[i][j].isShown = true
    elCell.innerText = gBoard[i][j].isMine ? '💣' : gBoard[i][j].minesAroundCount

    if (gBoard[i][j].isMine) {
        //TODO: Build game over function
        console.log('Game Over! You clicked a mine!')
    }

    if (gBoard[i][j].minesAroundCount === 0) {
        //TODO:Expand all the neighbors 
    }
}

function onCellMarked(elCell) {

    //TODO: Called when a cell is right-clicked
    //TODO: To check how can I hide the context menu

}

function checkGameOver() {
    //TODO: Game ends when all mines are marked, and all the other cells are shown

}

function expandShown(board, elCell, i, j) {
    //TODO: When user clicks a cell with no mines around , open not only that cell but also its neighbors.
    //NOTE: Start with a basic implementation that only opens the non mine 1st degree neighbors
    //BONUS: for later , try to work more like the real algorithm 

}

