import React, { useRef, useState, useEffect } from "react";
import {
  horizontalAxis,
  PieceType,
  TeamType,
  verticalAxis,
} from "../constants/Constants";
import {
  findKing,
  isCheckmate,
  isKingInCheck,
  isMoveOnPinLine,
  isPiecePinned,
  isValidMove,
} from "./refree/Refree";
import highlightMove from "../assets/highlightMove.png";

export default function ChessBoard() {
  const board = [];
  const chessBoardRef = useRef(null);
  const [gameEnded, setGameEnded] = useState(false);
  const [winner, setWinner] = useState(null);
  const [pieces, setPieces] = useState([]);
  const [currentTurn, setCurrentTurn] = useState(TeamType.OUR);
  const [selectedPiece, setSelectedPiece] = useState(null);
  const [validMoves, setValidMoves] = useState([]);
  const [promotionPawn, setPromotionPawn] = useState(null);
  const [promotionSquare, setPromotionSquare] = useState(null);

  // Initialize the board state only once
  useEffect(() => {
    const initialBoardState = [];

    // Initialize pieces for both teams (OPPONENT and OUR)
    for (let p = 1; p <= 2; p++) {
      const teamType = p === 1 ? TeamType.OPPONENT : TeamType.OUR;
      const type = teamType === TeamType.OPPONENT ? "b" : "w";
      const y = teamType === TeamType.OPPONENT ? 8 : 1;

      // Add pawns to the board
      for (let i = 1; i <= 8; i++) {
        initialBoardState.push({
          image: `/assets/pawn_${type}.png`,
          x: i,
          y: teamType === TeamType.OPPONENT ? 7 : 2,
          type: PieceType.PAWN,
          team: teamType,
          hasMoved: false,
        });
      }

      // Add other pieces: rook, knight, bishop, queen, king
      initialBoardState.push({
        image: `/assets/rook_${type}.png`,
        x: 1,
        y,
        type: PieceType.ROOK,
        team: teamType,
        hasMoved: false,
      });
      initialBoardState.push({
        image: `/assets/rook_${type}.png`,
        x: 8,
        y,
        type: PieceType.ROOK,
        team: teamType,
        hasMoved: false,
      });
      initialBoardState.push({
        image: `/assets/knight_${type}.png`,
        x: 2,
        y,
        type: PieceType.KNIGHT,
        team: teamType,
        hasMoved: false,
      });
      initialBoardState.push({
        image: `/assets/knight_${type}.png`,
        x: 7,
        y,
        type: PieceType.KNIGHT,
        team: teamType,
        hasMoved: false,
      });
      initialBoardState.push({
        image: `/assets/bishop_${type}.png`,
        x: 3,
        y,
        type: PieceType.BISHOP,
        team: teamType,
        hasMoved: false,
      });
      initialBoardState.push({
        image: `/assets/bishop_${type}.png`,
        x: 6,
        y,
        type: PieceType.BISHOP,
        team: teamType,
        hasMoved: false,
      });
      initialBoardState.push({
        image: `/assets/queen_${type}.png`,
        x: 4,
        y,
        type: PieceType.QUEEN,
        team: teamType,
        hasMoved: false,
      });
      initialBoardState.push({
        image: `/assets/king_${type}.png`,
        x: 5,
        y,
        type: PieceType.KING,
        team: teamType,
        hasMoved: false,
      });
    }

    // Set the pieces to state
    setPieces(initialBoardState);
  }, []); // Empty dependency array ensures this runs only once when component mounts

  function selectPiece(x, y) {
    const piece = pieces.find((p) => p.x === x && p.y === y);

    if (!piece || piece.team !== currentTurn) return;

    const moves = [];

    for (let j = 1; j <= 8; j++) {
      for (let i = 1; i <= 8; i++) {
        if (isValidMove(x, y, i, j, piece.type, piece.team, pieces)) {
          moves.push({ x: i, y: j });
        }
      }
    }

    setSelectedPiece(piece);
    setValidMoves(moves);
  }

  function movePiece(x, y) {
    if (!selectedPiece || gameEnded) return;
    const isValid = validMoves.some((move) => move.x === x && move.y === y);

    if (!isValid) {
      setSelectedPiece(null);
      setValidMoves([]);
      return;
    }

    setPieces((prevPieces) => {
      let updatedPieces = prevPieces
        .filter((p) => !(p.x === x && p.y === y)) // Capture logic
        .map((p) =>
          p.x === selectedPiece.x && p.y === selectedPiece.y
            ? { ...p, x, y, hasMoved: true }
            : p
        );
      let movedPiece = prevPieces.find(
        (p) => p.x === selectedPiece.x && p.y === selectedPiece.y
      );

      // **Castling Logic**
      if (
        movedPiece.type === PieceType.KING &&
        Math.abs(movedPiece.x - x) === 2
      ) {
        const isKingside = x > movedPiece.x;
        const rookX = isKingside ? 8 : 1;
        const newRookX = isKingside ? 6 : 4;

        updatedPieces = updatedPieces.map((p) =>
          p.x === rookX && p.y === movedPiece.y
            ? { ...p, x: newRookX, hasMoved: true }
            : p
        );
      }

      // Check if the moved piece is a pawn reaching the last rank
      if (movedPiece.type === PieceType.PAWN && (y === 1 || y === 8)) {
        setPromotionPawn(movedPiece);
        setPromotionSquare({ x, y });
        return updatedPieces; // Temporarily remove pawn
      }

      // Checkmate detection
      const opponentTeam =
        currentTurn === TeamType.OUR ? TeamType.OPPONENT : TeamType.OUR;
      // console.log(isCheckmate(opponentTeam, updatedPieces));

      if (isCheckmate(opponentTeam, updatedPieces)) {
        setGameEnded(true);
        setWinner(currentTurn === TeamType.OUR ? "White" : "Black");
      }

      return [...updatedPieces, { ...movedPiece, x, y }];
    });

    setSelectedPiece(null);
    setValidMoves([]);
    // Switch turn **only if no promotion**
    if (
      !gameEnded &&
      !(selectedPiece.type === PieceType.PAWN && (y === 1 || y === 8))
    ) {
      setCurrentTurn((prevTurn) =>
        prevTurn === TeamType.OUR ? TeamType.OPPONENT : TeamType.OUR
      );
    }
  }

  function promotePawn(pieceType) {
    if (!promotionPawn || !promotionSquare) return;

    setPieces((prevPieces) =>
      prevPieces
        .filter(
          (p) => !(p.x === promotionSquare.x && p.y === promotionSquare.y)
        ) // Remove the old pawn
        .concat({
          x: promotionSquare.x,
          y: promotionSquare.y,
          team: promotionPawn.team,
          type: pieceType,
          image: `/assets/${pieceType.toLowerCase()}_${
            promotionPawn.team === TeamType.OUR ? "w" : "b"
          }.png`,
        })
    );

    setPromotionPawn(null);
    setPromotionSquare(null);

    // Switch turn after promotion
    setCurrentTurn((prevTurn) =>
      prevTurn === TeamType.OUR ? TeamType.OPPONENT : TeamType.OUR
    );
  }

  // Rendering the chessboard
  for (let j = verticalAxis.length - 1; j >= 1; j--) {
    for (let i = 1; i < horizontalAxis.length; i++) {
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
    <div className="flex w-full justify-evenly h-screen p-4 bg-gray-200">
      {/* Chessboard Section */}
      <div className="flex justify-center items-center">
        <div
          id="chessboard"
          className="grid grid-cols-8 grid-rows-8 w-[600px] h-[600px] border-4 border-black"
          ref={chessBoardRef}
        >
          {board}
        </div>
      </div>

      {/* Right Panel (Turn Indicator, Promotion, Notation) */}
      <div className="w-1/3 p-4 bg-white shadow-lg rounded-lg">
        {/* Turn Indicator */}
        <h2 className="text-xl font-bold text-center mb-4">
          {currentTurn === TeamType.OUR ? "White's Turn" : "Black's Turn"}
        </h2>
        {gameEnded && (
          <h2 className="text-xl font-bold text-center mb-4">{winner} Wins!</h2>
        )}

        {/* Pawn Promotion Options */}
        {promotionPawn && (
          <div className="mb-4 p-2 bg-gray-100 rounded-lg">
            <h3 className="text-lg font-semibold mb-2">Promote to:</h3>
            <div className="grid grid-cols-4 gap-2">
              <button
                className="p-2 bg-blue-500 text-white rounded-lg"
                onClick={() => promotePawn(PieceType.QUEEN)}
              >
                <img
                  src={`/assets/queen_${
                    promotionPawn.team === TeamType.OUR ? "w" : "b"
                  }.png`}
                  alt=""
                  style={{ height: 60, width: 60 }}
                />
              </button>
              <button
                className="p-2 bg-green-500 text-white rounded-lg"
                onClick={() => promotePawn(PieceType.ROOK)}
              >
                <img
                  src={`/assets/rook_${
                    promotionPawn.team === TeamType.OUR ? "w" : "b"
                  }.png`}
                  alt=""
                  style={{ height: 60, width: 60 }}
                />
              </button>
              <button
                className="p-2 bg-yellow-500 text-white rounded-lg"
                onClick={() => promotePawn(PieceType.BISHOP)}
              >
                <img
                  src={`/assets/bishop_${
                    promotionPawn.team === TeamType.OUR ? "w" : "b"
                  }.png`}
                  alt=""
                  style={{ height: 60, width: 60 }}
                />
              </button>
              <button
                className="p-2 bg-red-500 text-white rounded-lg"
                onClick={() => promotePawn(PieceType.KNIGHT)}
              >
                <img
                  src={`/assets/knight_${
                    promotionPawn.team === TeamType.OUR ? "w" : "b"
                  }.png`}
                  alt=""
                  style={{ height: 60, width: 60 }}
                />
              </button>
            </div>
          </div>
        )}

        {/* Move Notation Box */}
        <div className="p-2 h-96 bg-gray-50 border rounded-lg overflow-auto">
          <h3 className="text-lg font-semibold text-center">Move Notation</h3>
          <div className="text-sm text-gray-700">
            <ul>
              {/* <li>1. e4 e5</li>
              <li>2. Nf3 Nc6</li>
              <li>3. Bb5 a6</li> */}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
