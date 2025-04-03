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

const isPiecePinned = (piece, boardState) => {
  const king = findKing(piece.team, boardState);
  if (!king) return false;

  return boardState.some((enemy) => {
    if (enemy.team === piece.team) return false;
    if (
      ![PieceType.ROOK, PieceType.BISHOP, PieceType.QUEEN].includes(enemy.type)
    )
      return false;

    if (
      isPathClear(enemy.x, enemy.y, king.x, king.y, boardState) &&
      isPathClear(enemy.x, enemy.y, piece.x, piece.y, boardState)
    ) {
      return true;
    }
    return false;
  });
};

const canBlockOrCapture = (team, boardState, moveHistory) => {
  const king = findKing(team, boardState);
  if (!king) return false;

  const attackingPieces = boardState.filter(
    (p) =>
      p.team !== team &&
      isValidMove(p.x, p.y, king.x, king.y, p.type, p.team, boardState)
  );

  if (attackingPieces?.length !== 1) return false;

  const attacker = attackingPieces[0];

  // Check if any piece can capture the attacker
  if (
    boardState.some(
      (p) =>
        p.team === team &&
        isValidMove(
          p.x,
          p.y,
          attacker.x,
          attacker.y,
          p.type,
          p.team,
          boardState
        )
    )
  ) {
    return true;
  }

  // Check if any piece can block the attack
  const attackPath = [];
  let stepX = attacker.x === king.x ? 0 : attacker.x > king.x ? -1 : 1;
  let stepY = attacker.y === king.y ? 0 : attacker.y > king.y ? -1 : 1;
  let x = attacker.x + stepX,
    y = attacker.y + stepY;

  while (x !== king.x || y !== king.y) {
    attackPath.push({ x, y });
    x += stepX;
    y += stepY;
  }

  return boardState.some(
    (p) =>
      p.team === team &&
      attackPath.some((tile) =>
        isValidMove(p.x, p.y, tile.x, tile.y, p.type, p.team, boardState)
      )
  );
};

// Check if a move puts the king in check
export const isKingInCheck = (kingX, kingY, team, boardState, moveHistory) => {
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
        boardState,
        moveHistory
      )
  );
};

// Find the king's position
const findKing = (team, boardState) => {
  return boardState.find((p) => p.type === PieceType.KING && p.team === team);
};

// Check if the current player is in checkmate

export const isKingCheckmate = (team, boardState, moveHistory) => {
  const king = findKing(team, boardState);
  if (!king) return true;

  if (!isKingInCheck(king.x, king.y, team, boardState)) return false;

  // If the king has a legal move, it's not checkmate
  for (let dx = -1; dx <= 1; dx++) {
    for (let dy = -1; dy <= 1; dy++) {
      if (dx === 0 && dy === 0) continue;
      if (
        isValidMove(
          king.x,
          king.y,
          king.x + dx,
          king.y + dy,
          PieceType.KING,
          team,
          boardState
        ) &&
        !isKingInCheck(king.x + dx, king.y + dy, team, boardState)
      ) {
        return false;
      }
    }
  }

  // If no piece can block or capture the attacker, it's checkmate
  return !canBlockOrCapture(team, boardState, moveHistory);
};

export const isValidMove = (
  px,
  py,
  x,
  y,
  type,
  team,
  boardState,
  moveHistory
) => {
  let targetOccupied = isTileOccupied(x, y, boardState);
  let targetOpponent = isOpponentPiece(x, y, boardState, team);

  if (isPiecePinned({ x: px, y: py, team }, boardState)) {
    return false;
  }

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
      // if (Math.abs(px - x) === 1 && y - py === pawnDirection) {
      //   // Normal capture
      //   if (isOpponentPiece(x, y, boardState, team)) return true;

      //   // En passant capture
      //   const lastMove = moveHistory[moveHistory?.length - 1];
      //   if (lastMove) {
      //     const [lastMoveFromX, lastMoveFromY, lastMoveToX, lastMoveToY] =
      //       lastMove.match(/\d/g).map(Number);
      //     const lastMovedPiece = boardState.find(
      //       (p) => p.x === lastMoveToX && p.y === lastMoveToY
      //     );

      //     if (
      //       lastMovedPiece &&
      //       lastMovedPiece.type === PieceType.PAWN &&
      //       lastMovedPiece.team !== team &&
      //       lastMoveFromY === (team === TeamType.OUR ? 6 : 1) &&
      //       lastMoveToY === (team === TeamType.OUR ? 4 : 3) &&
      //       lastMoveToX === x
      //     ) {
      //       return true; // En passant is valid
      //     }
      //   }
      // }
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
