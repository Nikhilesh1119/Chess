import { PieceType, TeamType } from "../../constants/Constants";

const isTileOccupied = (x, y, boardState) => {
  return boardState.some((p) => p.x === x && p.y === y);
};

const isOpponentPiece = (x, y, boardState, team) => {
  const piece = boardState.find((p) => p.x === x && p.y === y);
  return piece && piece.team !== team;
};

const isPathClear = (px, py, x, y, boardState) => {
  let dx = x - px;
  let dy = y - py;
  let stepX = dx === 0 ? 0 : dx / Math.abs(dx);
  let stepY = dy === 0 ? 0 : dy / Math.abs(dy);

  let currentX = px + stepX;
  let currentY = py + stepY;

  while (currentX !== x || currentY !== y) {
    if (isTileOccupied(currentX, currentY, boardState)) return false;
    currentX += stepX;
    currentY += stepY;
  }
  return true;
};

// Check if a move puts the king in check
const isKingInCheck = (kingX, kingY, team, boardState) => {
  return boardState.some(
    (piece) =>
      piece.team !== team &&
      isValidMove(
        piece.x,
        piece.y,
        kingX,
        kingY,
        piece.type,
        piece.team,
        boardState
      )
  );
};

// Find the king's position
const findKing = (team, boardState) => {
  return boardState.find((p) => p.type === PieceType.KING && p.team === team);
};

// Check if the current player is in checkmate
const isCheckmate = (team, boardState) => {
  const king = findKing(team, boardState);
  if (!king) return true; // King doesn't exist, it's checkmate

  if (!isKingInCheck(king.x, king.y, team, boardState)) return false; // Not in check

  // Check if the king has any valid move
  for (let dx = -1; dx <= 1; dx++) {
    for (let dy = -1; dy <= 1; dy++) {
      if (dx === 0 && dy === 0) continue;
      const newX = king.x + dx;
      const newY = king.y + dy;
      if (
        isValidMove(
          king.x,
          king.y,
          newX,
          newY,
          PieceType.KING,
          team,
          boardState
        ) &&
        !isKingInCheck(newX, newY, team, boardState)
      ) {
        return false;
      }
    }
  }

  return true;
};

export const isValidMove = (
  px,
  py,
  x,
  y,
  type,
  team,
  boardState,
  enPassantTarget
) => {
  let targetOccupied = isTileOccupied(x, y, boardState);
  let targetOpponent = isOpponentPiece(x, y, boardState, team);

  switch (type) {
    case PieceType.PAWN: {
      const specialRow = team === TeamType.OUR ? 1 : 6;
      const pawnDirection = team === TeamType.OUR ? 1 : -1;

      // Normal move
      if (px === x && y - py === pawnDirection && !targetOccupied) {
        return true;
      }

      // First double move
      if (
        px === x &&
        py === specialRow &&
        y - py === 2 * pawnDirection &&
        !targetOccupied
      ) {
        return !isTileOccupied(x, y - pawnDirection, boardState);
      }

      // Capture move
      if (
        Math.abs(px - x) === 1 &&
        y - py === pawnDirection &&
        targetOpponent
      ) {
        return true;
      }

      return false;
    }

    case PieceType.ROOK:
      return (
        (px === x || py === y) &&
        isPathClear(px, py, x, y, boardState) &&
        (!targetOccupied || targetOpponent)
      );

    case PieceType.BISHOP:
      return (
        Math.abs(px - x) === Math.abs(py - y) &&
        isPathClear(px, py, x, y, boardState) &&
        (!targetOccupied || targetOpponent)
      );

    case PieceType.QUEEN:
      return (
        (px === x || py === y || Math.abs(px - x) === Math.abs(py - y)) &&
        isPathClear(px, py, x, y, boardState) &&
        (!targetOccupied || targetOpponent)
      );

    case PieceType.KNIGHT:
      return (
        ((Math.abs(px - x) === 2 && Math.abs(py - y) === 1) ||
          (Math.abs(px - x) === 1 && Math.abs(py - y) === 2)) &&
        (!targetOccupied || targetOpponent)
      );

    case PieceType.KING:
      return (
        Math.abs(px - x) <= 1 &&
        Math.abs(py - y) <= 1 &&
        (!targetOccupied || targetOpponent) &&
        !isKingInCheck(x, y, team, boardState)
      );

    default:
      return false;
  }
};
