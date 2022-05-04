import React, { useCallback, useState, useEffect } from "react";

const checkNumberProp = (prop: any, fallback: number): number => {
  if (typeof prop === "number") {
    return prop;
  } else {
    return fallback;
  }
};

const checkNumberOrFunctionProp = (
  prop: any,
  fallback: number
): number | ((index: number) => number) => {
  if (typeof prop === "number" || typeof prop === "function") {
    return prop;
  } else {
    return fallback;
  }
};

const checkFunctionProp = (
  prop: any,
  fallback: () => null
): ((info: {
  rowIndex: number;
  columnIndex: number;
  style: React.CSSProperties;
}) => JSX.Element | null) => {
  if (typeof prop === "function") {
    return prop;
  } else {
    return fallback;
  }
};

export const Virtualizer = React.memo<{
  numRows: number;
  numColumns: number;
  rowHeight: number | ((index: number) => number);
  columnWidth: number | ((index: number) => number);
  containerHeight: number;
  containerWidth: number;
  children: (info: {
    rowIndex: number;
    columnIndex: number;
    style: React.CSSProperties;
  }) => JSX.Element | null;
}>((props) => {
  const numRows = checkNumberProp(props.numRows, 0);
  const numColumns = checkNumberProp(props.numColumns, 0);
  const rowHeight = checkNumberOrFunctionProp(props.rowHeight, 0);
  const columnWidth = checkNumberOrFunctionProp(props.columnWidth, 0);
  const containerHeight = checkNumberProp(props.containerHeight, 0);
  const containerWidth = checkNumberProp(props.containerWidth, 0);
  const children = checkFunctionProp(props.children, () => null);

  const totalHeight =
    typeof rowHeight === "number"
      ? numRows * rowHeight
      : new Array(numRows)
          .fill(null)
          .reduce<number>((acc, _, index) => acc + rowHeight(index), 0);
  const totalWidth =
    typeof columnWidth === "number"
      ? numColumns * columnWidth
      : new Array(numColumns)
          .fill(null)
          .reduce<number>((acc, _, index) => acc + columnWidth(index), 0);

  const [firstVisibleRow, setFirstVisibleRow] = useState(0);
  const [lastVisibleRow, setLastVisibleRow] = useState(
      typeof rowHeight === 'number' ? Math.min(containerHeight / rowHeight , numRows) - 1 : 0
  );
  const [firstVisibleColumn, setFirstVisibleColumn] = useState(0);
  const [lastVisibleColumn, setLastVisibleColumn] = useState(
      typeof columnWidth === 'number' ? Math.min(containerWidth / columnWidth, numColumns) - 1 : 0
  );

  useEffect(() => setLastVisibleRow(
    typeof rowHeight === 'number' ? Math.min(containerHeight / rowHeight , numRows) - 1 : 0
), [numRows, containerHeight, rowHeight]);

  useEffect(() => setLastVisibleColumn(
    typeof columnWidth === 'number' ? Math.min(containerWidth / columnWidth, numColumns) - 1 : 0
  ), [numColumns, columnWidth, containerWidth]);
  
  const onScroll = useCallback<React.UIEventHandler<HTMLDivElement>>(
      ({ currentTarget }) => {
          if (
              typeof rowHeight !== 'number' ||
                typeof columnWidth !== 'number'
            ) {
                return;
            }
            const { scrollTop, scrollLeft } = currentTarget;

            
            const lastVisibleRowScroll = Math.floor((scrollTop + containerHeight) / rowHeight);
            const lastVisibleColumnScroll = Math.floor((scrollLeft + containerWidth) / columnWidth);
            setFirstVisibleRow(Math.floor(scrollTop / rowHeight));

            if(lastVisibleRowScroll <= numRows) {
              setLastVisibleRow(lastVisibleRowScroll);
            }

            setFirstVisibleColumn(Math.floor(scrollLeft / columnWidth));
            if(lastVisibleColumnScroll <= numColumns) {
              setLastVisibleColumn(lastVisibleColumnScroll);
            }
        },
        [rowHeight, containerWidth, containerHeight, columnWidth]
    );

  return (
      <div
          style={{
              height: containerHeight,
              width: containerWidth,
              overflow: 'auto',
              position: 'relative'
          }}
          onScroll={onScroll}
      >
          <div
              style={{
                  height: totalHeight,
                  width: totalWidth,
                  position: 'absolute'
              }}
          >
              {new Array(lastVisibleRow + 1 - firstVisibleRow)
                  .fill(null)
                  .map((_, y) =>
                      new Array(lastVisibleColumn + 1 - firstVisibleColumn)
                          .fill(null)
                          .map((__, x) => {
                              const rowIndex = firstVisibleRow + y;
                              const columnIndex = firstVisibleColumn + x;
                              const style: React.CSSProperties = {
                                  position: 'absolute',
                                  top:
                                      typeof rowHeight === 'number'
                                          ? rowIndex * rowHeight
                                          : new Array(rowIndex)
                                                .fill(null)
                                                .reduce<number>(
                                                    (acc, cur, index) =>
                                                        acc +
                                                        rowHeight(index),
                                                    0
                                                ),
                                  left:
                                      typeof columnWidth === 'number'
                                          ? columnIndex * columnWidth
                                          : new Array(columnIndex)
                                                .fill(null)
                                                .reduce<number>(
                                                    (acc, cur, index) =>
                                                        acc +
                                                        columnWidth(index),
                                                    0
                                                ),
                                  height:
                                      typeof rowHeight === 'number'
                                          ? rowHeight
                                          : rowHeight(rowIndex),
                                  width:
                                      typeof columnWidth === 'number'
                                          ? columnWidth
                                          : columnWidth(columnIndex)
                              };
                              return children({
                                  rowIndex,
                                  columnIndex,
                                  style
                              });
                          })
                  )}
          </div>
      </div>
  );
});
