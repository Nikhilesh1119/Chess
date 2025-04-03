import React, { useRef, useState, useEffect } from "react";
import {
  horizontalAxis,
  PieceType,
  TeamType,
  verticalAxis,
} from "../constants/Constants";
import { isKingCheckmate, isKingInCheck, isValidMove } from "./refree/Refree";
import highlightMove from "../assets/highlightMove.png";
import { getNotation } from "./refree/chessNotation";

export default function ChessBoard() {
  const board = [];
  const chessBoardRef = useRef(null);
  const [gameStarted, setGameStarted] = useState(false);
  const [gameEnded, setGameEnded] = useState(false);
  const [winner, setWinner] = useState(null);
  const [pieces, setPieces] = useState([]);
  const [currentTurn, setCurrentTurn] = useState(TeamType.OUR);
  const [selectedPiece, setSelectedPiece] = useState(null);
  const [validMoves, setValidMoves] = useState([]);
  const [moveHistory, setMoveHistory] = useState([]);
  const [fullMoveNumber, setFullMoveNumber] = useState(1);
  // Initialize the board state only once
  useEffect(() => {
    const initialBoardState = [];

    // Initialize pieces for both teams (OPPONENT and OUR)
    for (let p = 0; p < 2; p++) {
      const teamType = p === 0 ? TeamType.OPPONENT : TeamType.OUR;
      const type = teamType === TeamType.OPPONENT ? "b" : "w";
      const y = teamType === TeamType.OPPONENT ? 7 : 0;

      // Add pawns to the board
      for (let i = 0; i < 8; i++) {
        initialBoardState.push({
          image: `/assets/pawn_${type}.png`,
          x: i,
          y: teamType === TeamType.OPPONENT ? 6 : 1,
          type: PieceType.PAWN,
          team: teamType,
        });
      }

      // Add other pieces: rook, knight, bishop, queen, king
      initialBoardState.push({
        image: `/assets/rook_${type}.png`,
        x: 0,
        y,
        type: PieceType.ROOK,
        team: teamType,
      });
      initialBoardState.push({
        image: `/assets/rook_${type}.png`,
        x: 7,
        y,
        type: PieceType.ROOK,
        team: teamType,
      });
      initialBoardState.push({
        image: `/assets/knight_${type}.png`,
        x: 1,
        y,
        type: PieceType.KNIGHT,
        team: teamType,
      });
      initialBoardState.push({
        image: `/assets/knight_${type}.png`,
        x: 6,
        y,
        type: PieceType.KNIGHT,
        team: teamType,
      });
      initialBoardState.push({
        image: `/assets/bishop_${type}.png`,
        x: 2,
        y,
        type: PieceType.BISHOP,
        team: teamType,
      });
      initialBoardState.push({
        image: `/assets/bishop_${type}.png`,
        x: 5,
        y,
        type: PieceType.BISHOP,
        team: teamType,
      });
      initialBoardState.push({
        image: `/assets/queen_${type}.png`,
        x: 3,
        y,
        type: PieceType.QUEEN,
        team: teamType,
      });
      initialBoardState.push({
        image: `/assets/king_${type}.png`,
        x: 4,
        y,
        type: PieceType.KING,
        team: teamType,
      });
    }

    // Set the pieces to state
    setPieces(initialBoardState);
  }, []); // Empty dependency array ensures this runs only once when component mounts

  function startGame() {
    setGameStarted(true);
    setGameEnded(false);
    setWinner(null);
  }

  function selectPiece(prevX, prevY) {
    const piece = pieces.find((p) => p.x === prevX && p.y === prevY);

    if (!piece || piece.team !== currentTurn) return;

    const moves = [];
    for (let j = 0; j < 8; j++) {
      for (let i = 0; i < 8; i++) {
        if (
          isValidMove(
            prevX,
            prevY,
            i,
            j,
            piece.type,
            piece.team,
            pieces,
            moveHistory
          )
        ) {
          moves.push({ x: i, y: j });
        }
      }
    }

    setSelectedPiece(piece);
    setValidMoves(moves);
    // console.log(validMoves);
  }

  function movePiece(currX, currY) {
    if (!selectedPiece) return;
    if (selectedPiece.team !== currentTurn) return;
    const isValid = validMoves.some(
      (move) => move.x === currX && move.y === currY
    );

    if (!isValid) {
      setSelectedPiece(null);
      setValidMoves([]);
      return;
    }

    setPieces((prevPieces) => {
      const capturedPiece = prevPieces.find(
        (p) => p.x === currX && p.y === currY
      );
      const updatedPieces = prevPieces
        .filter((p) => !(p.x === currX && p.y === currY)) // Capture logic
        .map((p) =>
          p.x === selectedPiece.x && p.y === selectedPiece.y
            ? { ...p, currX, currY }
            : p
        );

      // Check if the opponent's king is in checkmate after a move
      const opponentTeam =
        currentTurn === TeamType.OUR ? TeamType.OPPONENT : TeamType.OUR;
      const isCheck = isKingInCheck(
        currX,
        currY,
        opponentTeam,
        updatedPieces,
        moveHistory
      );
      const isCheckmate = isKingCheckmate(
        opponentTeam,
        updatedPieces,
        moveHistory
      );

      // Generate move notation
      const moveNotation = getNotation(
        selectedPiece.type,
        selectedPiece.x,
        selectedPiece.y,
        currX,
        currY,
        !!capturedPiece,
        isCheck,
        isCheckmate,
        moveHistory,
        prevPieces
      );

      setMoveHistory((prevHistory) => {
        const newHistory = [...prevHistory];

        if (currentTurn === TeamType.OUR) {
          newHistory.push(`${fullMoveNumber}. ${moveNotation}`);
        } else {
          newHistory[newHistory?.length - 1] += ` ${moveNotation}`;
          setFullMoveNumber((prev) => prev + 1);
        }

        return newHistory;
      });
      if (isCheckmate) {
        setGameEnded(true);
        setWinner(currentTurn === TeamType.OUR ? "White" : "Black");
      }

      return updatedPieces;
    });

    setSelectedPiece(null);
    setValidMoves([]);
    setCurrentTurn((prevTurn) =>
      prevTurn === TeamType.OUR ? TeamType.OPPONENT : TeamType.OUR
    );
  }

  // Rendering the chessboard
  for (let j = verticalAxis?.length - 1; j >= 0; j--) {
    for (let i = 0; i < horizontalAxis?.length; i++) {
      let number = j + i + 2;
      let piece = pieces.find((p) => p.x === i && p.y === j);
      let isHighlighted = validMoves.some(
        (move) => move.x === i && move.y === j
      );

      board.push(
        <div
          key={`${j},${i}`}
          className={`relative w-[75px] h-[75px] flex items-center justify-center ${
            number % 2 === 0 ? "bg-[#779556]" : "bg-[#ebecd0]"
          }`}
          onClick={() => (selectedPiece ? movePiece(i, j) : selectPiece(i, j))}
        >
          {/* Render piece */}
          {piece && (
            <div
              className={`chess-piece w-[60px] h-[60px] bg-no-repeat bg-center bg-contain`}
              style={{ backgroundImage: `url(${piece.image})` }}
            />
          )}

          {/* Render dot only if tile is highlighted */}
          {isHighlighted && (
            <img
              src={highlightMove}
              alt="Highlight"
              className="absolute"
              style={{
                height: 10,
                width: 10,
              }}
            />
          )}
        </div>
      );
    }
  }

  return (
    <>
      {!gameStarted ? (
        <div className="flex flex-col items-center justify-center h-screen">
          <h1 className="text-3xl font-bold">Welcome to Chess</h1>
          <button
            className="mt-4 px-6 py-2 bg-green-500 text-white text-lg rounded"
            onClick={startGame}
          >
            Start Game
          </button>
        </div>
      ) : gameEnded ? (
        <div className="flex flex-col items-center justify-center h-screen">
          <h1 className="text-3xl font-bold">{winner} Wins!</h1>
          <button
            className="mt-4 px-6 py-2 bg-blue-500 text-white text-lg rounded"
            onClick={() => window.location.reload()} // Restart game
          >
            Play Again
          </button>
        </div>
      ) : (
        <>
          <h2 className="text-lg font-bold text-center my-2">
            {currentTurn === TeamType.OUR ? "White's Turn" : "Black's Turn"}
          </h2>
          <div
            id="chessboard"
            className="grid grid-cols-8 grid-rows-8 w-[600px] h-[600px] m-4 border-4 border-black"
            ref={chessBoardRef}
          >
            {board}
          </div>
          <div className="move-history p-4 bg-gray-200 rounded">
            <h3 className="text-lg font-bold">Move History</h3>
            <ul>
              {moveHistory.map((move, index) => (
                <li key={index}>{move}</li>
              ))}
            </ul>
          </div>
        </>
      )}
    </>
  );
}
