export function isLowStock(quantity: number, reorderPoint: number): boolean {
  return quantity <= reorderPoint;
}

// Order enough to bring stock up to twice the reorder point
export function suggestedReorder(
  quantity: number,
  reorderPoint: number
): number {
  return Math.max(reorderPoint * 2 - quantity, 1);
}