class GameAudio {
    constructor() {
        this.ctx = null;
        this.muted = false;
    }

    init() {
        if (!this.ctx) {
            this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        }
    }

    playTone(freq, type, duration) {
        if (this.muted) return;
        this.init();
        if (this.ctx.state === 'suspended') this.ctx.resume();

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
        gain.gain.setValueAtTime(0.12, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(this.ctx.currentTime + duration);
    }

    playPlayerMove() { this.playTone(600, 'sine', 0.1); }
    playAiMove()     { this.playTone(400, 'sine', 0.1); }

    playWin() {
        setTimeout(() => this.playTone(523.25, 'triangle', 0.25), 0);
        setTimeout(() => this.playTone(659.25, 'triangle', 0.25), 150);
        setTimeout(() => this.playTone(783.99, 'triangle', 0.4), 300);
    }

    playLose() {
        setTimeout(() => this.playTone(392, 'sawtooth', 0.2), 0);
        setTimeout(() => this.playTone(349, 'sawtooth', 0.2), 150);
        setTimeout(() => this.playTone(293, 'sawtooth', 0.4), 300);
    }

    playTie() {
        this.playTone(330, 'triangle', 0.15);
        setTimeout(() => this.playTone(330, 'triangle', 0.15), 100);
    }
}

class TicTacToe {
    constructor() {
        this.board = Array(9).fill('');
        this.ai     = 'X';
        this.human  = 'O';
        this.startMode = 'AI';
        this.currentPlayer = 'X';
        this.isGameOver = false;
        this.isHumanTurn = false;

        this.scores = { player: 0, draws: 0, ai: 0 };
        this.audio = new GameAudio();

        this.winLines = [
            { combo: [0,1,2], coords: { x1:15, y1:50,  x2:285, y2:50  } },
            { combo: [3,4,5], coords: { x1:15, y1:150, x2:285, y2:150 } },
            { combo: [6,7,8], coords: { x1:15, y1:250, x2:285, y2:250 } },
            { combo: [0,3,6], coords: { x1:50,  y1:15, x2:50,  y2:285 } },
            { combo: [1,4,7], coords: { x1:150, y1:15, x2:150, y2:285 } },
            { combo: [2,5,8], coords: { x1:250, y1:15, x2:250, y2:285 } },
            { combo: [0,4,8], coords: { x1:20,  y1:20, x2:280, y2:280 } },
            { combo: [2,4,6], coords: { x1:280, y1:20, x2:20,  y2:280 } },
        ];

        this.initDom();
    }

    initDom() {
        this.dom = {
            cells:       document.querySelectorAll('.cell'),
            status:      document.getElementById('status-text'),
            scorePlayer: document.getElementById('score-player'),
            scoreDraws:  document.getElementById('score-draws'),
            scoreAi:     document.getElementById('score-ai'),
            btnReset:    document.getElementById('btn-reset'),
            btnSwitchStart: document.getElementById('btn-switch-start'),
            btnAudio:    document.getElementById('btn-audio'),
            strikeLine:  document.getElementById('strike-line-elem'),
        };

        this.dom.cells.forEach(cell => {
            cell.addEventListener('click', () => {
                this.handleCellClick(parseInt(cell.dataset.index));
            });
        });

        this.dom.btnReset.addEventListener('click', () => this.resetBoard());

        this.dom.btnSwitchStart.addEventListener('click', () => {
            this.startMode = this.startMode === 'AI' ? 'YOU' : 'AI';
            this.dom.btnSwitchStart.textContent = `FIRST: ${this.startMode}`;
            this.resetBoard();
        });

        this.dom.btnAudio.addEventListener('click', () => {
            this.audio.muted = !this.audio.muted;
            this.dom.btnAudio.textContent = this.audio.muted ? 'UNMUTE SOUND' : 'MUTE SOUND';
        });

        this.resetBoard();
    }

    resetBoard() {
        this.board = Array(9).fill('');
        this.currentPlayer = 'X';
        this.isGameOver = false;
        this.isHumanTurn = false;

        this.dom.cells.forEach(c => { c.textContent = ''; c.className = 'cell'; });

        this.dom.strikeLine.setAttribute('x1','0');
        this.dom.strikeLine.setAttribute('y1','0');
        this.dom.strikeLine.setAttribute('x2','0');
        this.dom.strikeLine.setAttribute('y2','0');
        this.dom.strikeLine.style.strokeDashoffset = '400';

        if (this.startMode === 'AI') {
            this.isHumanTurn = false;
            this.dom.status.textContent = 'AI is thinking…';
            this.dom.status.style.color = 'var(--neon-pink)';
            setTimeout(() => this.aiMove(), 400);
        } else {
            this.isHumanTurn = true;
            this.dom.status.textContent = 'Your turn (O) — You go first!';
            this.dom.status.style.color = 'var(--text-color)';
        }
    }

    handleCellClick(idx) {
        if (!this.isHumanTurn || this.board[idx] !== '' || this.isGameOver) return;

        this.placeMarker(idx, this.human);
        this.audio.playPlayerMove();

        if (this.checkEnd()) return;

        this.isHumanTurn = false;
        this.dom.status.textContent = 'AI is thinking…';
        this.dom.status.style.color = 'var(--neon-pink)';

        setTimeout(() => this.aiMove(), 300);
    }

    placeMarker(idx, player) {
        this.board[idx] = player;
        const cell = this.dom.cells[idx];
        cell.textContent = player;
        cell.classList.add(player.toLowerCase());
    }

    aiMove() {
        if (this.isGameOver) return;

        const move = this.getBestMove();
        this.placeMarker(move, this.ai);
        this.audio.playAiMove();

        if (this.checkEnd()) return;

        this.isHumanTurn = true;
        this.dom.status.textContent = 'Your turn (O)';
        this.dom.status.style.color = 'var(--text-color)';
    }

    checkEnd() {
        const winLine = this.findWinLine(this.board);
        if (winLine) {
            this.isGameOver = true;
            const winner = this.board[winLine.combo[0]];
            this.drawStrike(winLine, winner);

            if (winner === this.ai) {
                this.scores.ai++;
                this.dom.scoreAi.textContent   = this.scores.ai;
                this.dom.status.textContent     = 'AI Wins!';
                this.dom.status.style.color     = 'var(--neon-pink)';
                this.audio.playLose();
            } else {
                this.scores.player++;
                this.dom.scorePlayer.textContent = this.scores.player;
                this.dom.status.textContent      = 'You Win!';
                this.dom.status.style.color      = 'var(--neon-blue)';
                this.audio.playWin();
            }
            return true;
        }

        if (this.board.every(c => c !== '')) {
            this.isGameOver = true;
            this.scores.draws++;
            this.dom.scoreDraws.textContent = this.scores.draws;
            this.dom.status.textContent     = 'Tie Game!';
            this.dom.status.style.color     = 'var(--text-color)';
            this.audio.playTie();
            return true;
        }

        return false;
    }

    findWinLine(board) {
        for (const line of this.winLines) {
            const [a,b,c] = line.combo;
            if (board[a] && board[a] === board[b] && board[a] === board[c]) return line;
        }
        return null;
    }

    drawStrike(line, winner) {
        const { x1,y1,x2,y2 } = line.coords;
        const el = this.dom.strikeLine;
        el.setAttribute('x1', x1);
        el.setAttribute('y1', y1);
        el.setAttribute('x2', x2);
        el.setAttribute('y2', y2);

        const color = winner === this.ai ? 'var(--neon-pink)' : 'var(--neon-blue)';
        el.style.stroke = color;
        el.style.filter = `drop-shadow(0 0 8px ${color}) drop-shadow(0 0 15px ${color})`;
        el.getBoundingClientRect();
        el.style.strokeDashoffset = '0';
    }

    getBestMove() {
        const empty = this.emptyIndices();

        for (const i of empty) {
            this.board[i] = this.ai;
            if (this.findWinLine(this.board)) { this.board[i] = ''; return i; }
            this.board[i] = '';
        }

        for (const i of empty) {
            this.board[i] = this.human;
            if (this.findWinLine(this.board)) { this.board[i] = ''; return i; }
            this.board[i] = '';
        }

        return this.minimaxRoot();
    }

    countThreats(player, idx) {
        this.board[idx] = player;
        let threats = 0;
        for (const line of this.winLines) {
            const [a,b,c] = line.combo;
            const vals = [this.board[a], this.board[b], this.board[c]];
            const playerCount = vals.filter(v => v === player).length;
            const emptyCount  = vals.filter(v => v === '').length;
            if (playerCount === 2 && emptyCount === 1) threats++;
        }
        this.board[idx] = '';
        return threats;
    }

    findForkMove(player) {
        const empty = this.emptyIndices();
        let bestMove = null;
        let bestThreats = 0;

        for (const i of empty) {
            const threats = this.countThreats(player, i);
            if (threats >= 2 && threats > bestThreats) {
                bestThreats = threats;
                bestMove = i;
            }
        }
        return bestMove;
    }

    findAttackToBlockFork(humanForkCell) {
        const empty = this.emptyIndices();
        for (const i of empty) {
            this.board[i] = this.ai;
            let createsThreat = false;
            let threatCell = null;

            for (const line of this.winLines) {
                const [a,b,c] = line.combo;
                const vals = [this.board[a], this.board[b], this.board[c]];
                const aiCount    = vals.filter(v => v === this.ai).length;
                const emptyCount = vals.filter(v => v === '').length;
                if (aiCount === 2 && emptyCount === 1) {
                    createsThreat = true;
                    threatCell = [a,b,c].find(x => this.board[x] === '');
                }
            }
            this.board[i] = '';

            if (createsThreat && threatCell !== null) {
                this.board[i] = this.ai;
                this.board[threatCell] = this.human;
                const humanCanStillFork = this.findForkMove(this.human);
                this.board[i] = '';
                this.board[threatCell] = '';

                if (humanCanStillFork === null) {
                    return i;
                }
            }
        }
        return null;
    }

    emptyIndices() {
        return this.board.reduce((acc, v, i) => { if (v === '') acc.push(i); return acc; }, []);
    }

    minimaxRoot() {
        let bestScore = -Infinity;
        let bestMove  = null;
        for (const i of this.emptyIndices()) {
            this.board[i] = this.ai;
            const score = this.minimax(0, false, -Infinity, Infinity);
            this.board[i] = '';
            if (score > bestScore) { bestScore = score; bestMove = i; }
        }
        return bestMove;
    }

    minimax(depth, isMax, alpha, beta) {
        const win = this.findWinLine(this.board);
        if (win) {
            return this.board[win.combo[0]] === this.ai ? 100 - depth : depth - 100;
        }
        if (this.board.every(c => c !== '')) return 0;

        if (isMax) {
            let best = -Infinity;
            for (const i of this.emptyIndices()) {
                this.board[i] = this.ai;
                best = Math.max(best, this.minimax(depth+1, false, alpha, beta));
                this.board[i] = '';
                alpha = Math.max(alpha, best);
                if (beta <= alpha) break;
            }
            return best;
        } else {
            let best = Infinity;
            for (const i of this.emptyIndices()) {
                this.board[i] = this.human;
                best = Math.min(best, this.minimax(depth+1, true, alpha, beta));
                this.board[i] = '';
                beta = Math.min(beta, best);
                if (beta <= alpha) break;
            }
            return best;
        }
    }
}

window.addEventListener('DOMContentLoaded', () => {
    window.game = new TicTacToe();
});
