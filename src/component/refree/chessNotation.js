import { PieceType } from "../../constants/Constants";
import { isValidMove } from "./Refree";

export const getNotation = (
  piece,
  fromX,
  fromY,
  toX,
  toY,
  capture,
  isCheck,
  isCheckmate,
  moveHistory,
  pieces
) => {
  const files = "abcdefgh";
  const ranks = "12345678";
  const pieceNotation = {
    [PieceType.PAWN]: "",
    [PieceType.ROOK]: "R",
    [PieceType.KNIGHT]: "N",
    [PieceType.BISHOP]: "B",
    [PieceType.QUEEN]: "Q",
    [PieceType.KING]: "K",
  };

  // Handle castling
  if (piece === PieceType.KING && Math.abs(fromX - toX) === 2) {
    return toX === 6 ? "O-O" : "O-O-O";
  }

  let move = pieceNotation[piece] || "";

  // Pawn moves (capture notation)
  if (piece === PieceType.PAWN) {
    if (capture) move += files[fromX] + "x";
    move += `${files[toX]}${ranks[toY]}`;
  } else {
    // Piece moves
    const samePieceMoves = pieces.filter(
      (p) =>
        p.type === piece &&
        p.team === pieces.find((p) => p.x === fromX && p.y === fromY).team
    );

    let disambiguateFile = false;
    let disambiguateRank = false;

    if (samePieceMoves?.length > 1) {
      for (const other of samePieceMoves) {
        if (other.x === fromX && other.y === fromY) continue;
        if (
          isValidMove(
            other.x,
            other.y,
            toX,
            toY,
            piece,
            other.team,
            pieces,
            moveHistory
          )
        ) {
          if (other.x !== fromX) disambiguateFile = true;
          if (other.y !== fromY) disambiguateRank = true;
        }
      }
    }

    if (disambiguateFile) move += files[fromX];
    if (disambiguateRank) move += ranks[fromY];

    if (capture) move += "x";
    move += `${files[toX]}${ranks[toY]}`;
  }

  if (isCheckmate) move += "#";
  else if (isCheck) move += "+";

  return move;
};
