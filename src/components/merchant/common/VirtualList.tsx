'use client';

import { ReactNode, CSSProperties } from 'react';
// @ts-ignore - react-window types issue in monorepo
import { FixedSizeList } from 'react-window';
import AutoSizer from 'react-virtualized-auto-sizer';

interface VirtualListProps<T> {
  items: T[];
  renderItem: (item: T, index: number, style: CSSProperties) => ReactNode;
  itemHeight?: number;
  overscanCount?: number;
  className?: string;
  emptyMessage?: string;
}

/**
 * VirtualList - Renders large lists efficiently using virtualization
 *
 * Only renders items that are currently visible in the viewport,
 * significantly improving performance for lists with 100+ items.
 *
 * @example
 * ```tsx
 * <VirtualList
 *   items={products}
 *   itemHeight={80}
 *   renderItem={(product, index, style) => (
 *     <div style={style} className="border-b">
 *       <h3>{product.name}</h3>
 *       <p>{product.price}</p>
 *     </div>
 *   )}
 * />
 * ```
 */
export function VirtualList<T>({
  items,
  renderItem,
  itemHeight = 60,
  overscanCount = 3,
  className = '',
  emptyMessage = 'No items to display',
}: VirtualListProps<T>) {
  if (items.length === 0) {
    return (
      <div className={`flex items-center justify-center h-64 text-gray-500 ${className}`}>
        <p>{emptyMessage}</p>
      </div>
    );
  }

  const Row = ({ index, style }: { index: number; style: CSSProperties }) => {
    return renderItem(items[index], index, style);
  };

  return (
    <div className={`h-full ${className}`}>
      <AutoSizer>
        {({ height, width }) => (
          <FixedSizeList
            height={height}
            width={width}
            itemCount={items.length}
            itemSize={itemHeight as number}
            overscanCount={overscanCount}
          >
            {Row}
          </FixedSizeList>
        )}
      </AutoSizer>
    </div>
  );
}

/**
 * VirtualGrid - Renders large grids efficiently
 *
 * @example
 * ```tsx
 * <VirtualGrid
 *   items={products}
 *   columnCount={3}
 *   rowHeight={200}
 *   renderItem={(product, style) => (
 *     <div style={style}>
 *       <ProductCard product={product} />
 *     </div>
 *   )}
 * />
 * ```
 */
interface VirtualGridProps<T> {
  items: T[];
  renderItem: (item: T, style: CSSProperties) => ReactNode;
  columnCount: number;
  rowHeight: number;
  gap?: number;
  className?: string;
}

export function VirtualGrid<T>({
  items,
  renderItem,
  columnCount,
  rowHeight,
  gap = 16,
  className = '',
}: VirtualGridProps<T>) {
  const rowCount = Math.ceil(items.length / columnCount);

  const Row = ({ index, style }: { index: number; style: CSSProperties }) => {
    const rowItems: T[] = [];
    const startIndex = index * columnCount;

    for (let i = 0; i < columnCount; i++) {
      const itemIndex = startIndex + i;
      if (itemIndex < items.length) {
        rowItems.push(items[itemIndex]);
      }
    }

    return (
      <div style={style} className="flex" data-row-index={index}>
        {rowItems.map((item, colIndex) => {
          const itemIndex = startIndex + colIndex;
          const cellStyle: CSSProperties = {
            width: `calc((100% - ${gap * (columnCount - 1)}px) / ${columnCount})`,
            marginRight: colIndex < rowItems.length - 1 ? `${gap}px` : 0,
          };

          return (
            <div key={itemIndex} style={cellStyle}>
              {renderItem(item, cellStyle)}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className={`h-full ${className}`}>
      <AutoSizer>
        {({ height, width }) => (
          <FixedSizeList
            height={height}
            width={width}
            itemCount={rowCount}
            itemSize={rowHeight + gap}
            overscanCount={2}
          >
            {Row}
          </FixedSizeList>
        )}
      </AutoSizer>
    </div>
  );
}
