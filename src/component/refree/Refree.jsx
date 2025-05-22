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
export const isKingInCheck = (kingX, kingY, team, boardState) => {
  // console.log(
  //   boardState.some(
  //     (piece) =>
  //       piece.team !== team &&
  //       isValidMove(
  //         piece.x,
  //         piece.y,
  //         kingX,
  //         kingY,
  //         piece.type,
  //         piece.team,
  //         boardState
  //       )
  //   )
  // );

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
export const findKing = (team, boardState) => {
  return boardState.find((p) => p.type === PieceType.KING && p.team === team);
};

export const isPieceBetween = (king, attacker, piece) => {
  // Ensure piece is not the king or attacker
  if (piece.x === king.x && piece.y === king.y) return false;
  if (piece.x === attacker.x && piece.y === attacker.y) return false;

  // Check if piece is on the straight or diagonal path
  if (
    (king.x === attacker.x && piece.x === king.x) || // Vertical pin
    (king.y === attacker.y && piece.y === king.y) || // Horizontal pin
    (Math.abs(king.x - attacker.x) === Math.abs(king.y - attacker.y) &&
      Math.abs(piece.x - king.x) === Math.abs(piece.y - king.y)) // Diagonal pin
  ) {
    // Ensure the piece is between the king and attacker
    return (
      Math.min(king.x, attacker.x) < piece.x &&
      piece.x < Math.max(king.x, attacker.x) &&
      Math.min(king.y, attacker.y) < piece.y &&
      piece.y < Math.max(king.y, attacker.y)
    );
  }

  return false;
};

export const isMoveOnPinLine = (px, py, x, y, pinInfo) => {
  const dx = x - px,
    dy = y - py;
  return dx * pinInfo.dy === dy * pinInfo.dx; // Moves must be collinear with attack direction
};

export const isPiecePinned = (piece, boardState) => {
  const king = findKing(piece.team, boardState);
  if (!king) return null;

  for (let enemy of boardState) {
    if (enemy.team === piece.team) continue; // Ignore friendly pieces
    // console.log(
    //   isPathClear(enemy.x, enemy.y, king.x, king.y, boardState),
    //   isValidMove(
    //     enemy.x,
    //     enemy.y,
    //     king.x,
    //     king.y,
    //     enemy.type,
    //     enemy.team,
    //     boardState
    //   )
    // );

    // Check if enemy can attack the king through this piece
    if (
      isPathClear(enemy.x, enemy.y, king.x, king.y, boardState) &&
      isValidMove(
        enemy.x,
        enemy.y,
        king.x,
        king.y,
        enemy.type,
        enemy.team,
        boardState
      )
    ) {
      // Ensure piece is between enemy and king
      if (isPieceBetween(king, enemy, piece)) {
        return {
          attacker: enemy,
          dx: Math.sign(enemy.x - king.x),
          dy: Math.sign(enemy.y - king.y),
        };
      }
    }
  }

  return null;
};

// Get all pieces attacking the king
const getAttackingPieces = (kingX, kingY, team, boardState) => {
  return boardState.filter(
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

// Get valid moves that can block check
const getValidDefensiveMoves = (team, boardState) => {
  const king = findKing(team, boardState);
  if (!king) return [];

  const attackingPieces = getAttackingPieces(king.x, king.y, team, boardState);
  if (attackingPieces.length === 0) return boardState;

  const defensiveMoves = boardState.filter((piece) => {
    if (piece.team !== team || piece.type === PieceType.KING) return false;

    return attackingPieces.some((attacker) =>
      isValidMove(
        piece.x,
        piece.y,
        attacker.x,
        attacker.y,
        piece.type,
        team,
        boardState
      )
    );
  });

  return defensiveMoves;
};

export const isValidMove = (px, py, x, y, type, team, boardState) => {
  let targetOccupied = isTileOccupied(x, y, boardState);
  let targetOpponent = isOpponentPiece(x, y, boardState, team);

  switch (type) {
    case PieceType.PAWN: {
      const specialRow = team === TeamType.OUR ? 2 : 7;
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

    case PieceType.KING: {
      if (Math.abs(px - x) > 1 || Math.abs(py - y) > 1) {
        // Check for castling
        if (canCastle(px, py, x, team, boardState)) return true;
        return false;
      }

      if (targetOccupied && !targetOpponent) return false;

      // Prevent moving next to the opponent's king
      const opponentKing = findKing(
        team === TeamType.OUR ? TeamType.OPPONENT : TeamType.OUR,
        boardState
      );
      if (
        opponentKing &&
        Math.abs(opponentKing.x - x) <= 1 &&
        Math.abs(opponentKing.y - y) <= 1
      ) {
        return false;
      }

      // Temporarily move the king to check if it's still in check
      const tempBoard = boardState.map((p) =>
        p.x === px && p.y === py ? { ...p, x, y } : p
      );

      if (isKingInCheck(x, y, team, tempBoard)) return false;

      // Prevent capturing a protected piece
      if (targetOpponent && isKingInCheck(px, py, team, boardState))
        return false;

      return true;
    }

    default:
      return false;
  }
};

const canCastle = (px, py, x, team, boardState) => {
  if (py !== (team === TeamType.OUR ? 0 : 7)) return false; // King must be on the first rank
  if (px !== 4) return false; // King must start at e-file
  if (Math.abs(x - px) !== 2) return false; // Must move two squares left or right

  const king = boardState.find(
    (p) => p.type === PieceType.KING && p.team === team
  );
  if (!king || king.hasMoved) return false; // King must not have moved

  const isKingside = x > px;
  const rookX = isKingside ? 7 : 0;

  const rook = boardState.find(
    (p) =>
      p.x === rookX &&
      p.y === py &&
      p.type === PieceType.ROOK &&
      p.team === team
  );
  if (!rook || rook.hasMoved) return false; // Rook must not have moved

  // Ensure no pieces are between king and rook
  const minX = Math.min(px, rookX);
  const maxX = Math.max(px, rookX);
  for (let i = minX + 1; i < maxX; i++) {
    if (isTileOccupied(i, py, boardState)) return false;
  }

  // Ensure the king is not in check and doesn't move through check
  const tempBoard = boardState.map((p) =>
    p.x === px && p.y === py ? { ...p, x } : p
  );
  if (
    isKingInCheck(px, py, team, boardState) ||
    isKingInCheck(x, py, team, tempBoard)
  ) {
    return false;
  }

  return true;
};

// Check if the current player is in checkmate
export const isCheckmate = (team, boardState) => {
  const king = findKing(team, boardState);
  if (!king) return true;

  if (!isKingInCheck(king.x, king.y, team, boardState)) return false;

  for (let dx = -1; dx <= 1; dx++) {
    for (let dy = -1; dy <= 1; dy++) {
      if (dx === 0 && dy === 0) continue;
      const newX = king.x + dx;
      const newY = king.y + dy;
      // console.log(
      //   isValidMove(
      //     king.x,
      //     king.y,
      //     newX,
      //     newY,
      //     PieceType.KING,
      //     team,
      //     boardState
      //   )
      // );

      if (
        isValidMove(
          king.x,
          king.y,
          newX,
          newY,
          PieceType.KING,
          team,
          boardState
        )
      ) {
        return false;
      }
    }
  }

  // const defensiveMoves = getValidDefensiveMoves(team, boardState);
  // if (defensiveMoves.length > 0) return false;

  return true;
};
