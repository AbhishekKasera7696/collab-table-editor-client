import React, { useState, useEffect, useRef } from 'react';
import Cell from './Cell';

const Table = ({
  table = {},
  onUpdate = () => {},
  onDelete = () => {},
  onCellUpdate = () => {},
  onAddNestedTable = () => {},
  onSelectTable = () => {},
  onSelectCell = () => {},
  allTables = [],
  document = {},
  isMergeMode = false
}) => {
  const [showAddOptions, setShowAddOptions] = useState(false);
  const [selectedCells, setSelectedCells] = useState([]);
  const [isSelecting, setIsSelecting] = useState(false);
  const [addOptionPosition, setAddOptionPosition] = useState({ x: 0, y: 0 });
  const [hoverEdge, setHoverEdge] = useState(null);
  const tableRef = useRef(null);
  const [tableWidth, setTableWidth] = useState(0);
  const [addTimeout, setAddTimeout] = useState(null);

  // update width when table changes (guarded)
  useEffect(() => {
    if (tableRef.current) {
      const width = tableRef.current.offsetWidth;
      setTableWidth(width);
    }
  }, [table?.data, table?.columns, table?.rows]);

  const safeGetTablesArray = (doc) => (doc && Array.isArray(doc.tables) ? [...doc.tables] : []);

  const handleCellChange = (rowIndex, colIndex, content) => {
    onCellUpdate(table.id, rowIndex, colIndex, content);
  };

  const handleAddNestedTable = (rowIndex, colIndex, rows, cols) => {
    onAddNestedTable(table.id, rowIndex, colIndex, rows, cols);
  };

  const handleContextMenu = (e, rowIndex = null, colIndex = null) => {
    e.preventDefault();
    setAddOptionPosition({ x: e.clientX, y: e.clientY });
    setShowAddOptions(true);
    onSelectTable(table);
    if (rowIndex !== null && colIndex !== null) {
      onSelectCell({ tableId: table.id, rowIndex, colIndex });
    }
  };

  const handleAddTable = (rows, cols) => {
    setShowAddOptions(false);
  };

  const handleMouseEnterEdge = (edge) => {
    setHoverEdge(edge);

    if (addTimeout) {
      clearTimeout(addTimeout);
      setAddTimeout(null);
    }

    const timeout = setTimeout(() => {
      if (edge === 'top' || edge === 'bottom') {
        handleAddRow(edge);
      } else if (edge === 'left' || edge === 'right') {
        handleAddColumn(edge);
      }
    }, 500);

    setAddTimeout(timeout);
  };

  const handleMouseLeaveEdge = () => {
    setHoverEdge(null);
    if (addTimeout) {
      clearTimeout(addTimeout);
      setAddTimeout(null);
    }
  };

  const handleAddRow = (position) => {
    // defensive copy of table
    const updatedTable = { ...(table || {}) };

    // ensure data exists as array of arrays
    updatedTable.data = Array.isArray(updatedTable.data) ? updatedTable.data.map(r => [...r]) : [];

    const newRow = Array.from({ length: updatedTable.columns || 0 }, () => ({ content: '', type: 'text' }));

    if (position === 'top') {
      updatedTable.data = [newRow, ...updatedTable.data];
      updatedTable.rows = (updatedTable.rows || 0) + 1;
    } else if (position === 'bottom') {
      updatedTable.data = [...updatedTable.data, newRow];
      updatedTable.rows = (updatedTable.rows || 0) + 1;
    }

    // defensive: ensure document.tables exists
    const updatedDocument = { ...(document || {}) };
    updatedDocument.tables = safeGetTablesArray(document);

    const tableIndex = updatedDocument.tables.findIndex(t => t.id === updatedTable.id);
    if (tableIndex !== -1) {
      updatedDocument.tables[tableIndex] = updatedTable;
      onUpdate(updatedDocument);
    } else {
      // fallback: push if not found
      updatedDocument.tables.push(updatedTable);
      onUpdate(updatedDocument);
    }
  };

  const handleAddColumn = (position) => {
    const updatedTable = { ...(table || {}) };

    // ensure data lines exist
    updatedTable.data = Array.isArray(updatedTable.data) ? updatedTable.data.map(r => ([ ...r ])) : [];

    if (position === 'left') {
      // unshift a new cell for each row using Array.from to avoid shared refs
      updatedTable.data = updatedTable.data.map(row => [ { content: '', type: 'text' }, ...row ]);
      updatedTable.columns = (updatedTable.columns || 0) + 1;
    } else if (position === 'right') {
      updatedTable.data = updatedTable.data.map(row => [ ...row, { content: '', type: 'text' } ]);
      updatedTable.columns = (updatedTable.columns || 0) + 1;
    }

    // Defensive update of document.tables
    const updatedDocument = { ...(document || {}) };
    updatedDocument.tables = safeGetTablesArray(document);

    // findIndex is safe now because updatedDocument.tables is always an array
    const tableIndex = updatedDocument.tables.findIndex(t => t.id === updatedTable.id);

    if (tableIndex !== -1) {
      updatedDocument.tables[tableIndex] = updatedTable;
      onUpdate(updatedDocument);
    } else {
      // if the table wasn't present (unexpected) add it
      updatedDocument.tables.push(updatedTable);
      onUpdate(updatedDocument);
    }
  };

  const handleCellMouseDown = (rowIndex, colIndex, e) => {
    if (!isMergeMode) return;
    e.preventDefault();
    if (!table?.data?.[rowIndex]?.[colIndex]) return;
    if (table.data[rowIndex][colIndex].merged) return;
    setIsSelecting(true);
    setSelectedCells([{ rowIndex, colIndex, tableId: table.id }]);
  };

  const handleCellMouseOver = (rowIndex, colIndex) => {
    if (!isMergeMode || !isSelecting) return;
    if (!table?.data?.[rowIndex]?.[colIndex]) return;
    if (table.data[rowIndex][colIndex].merged) return;

    setSelectedCells(prev => {
      const isAlreadySelected = prev.some(cell => cell.rowIndex === rowIndex && cell.colIndex === colIndex);
      if (!isAlreadySelected) return [...prev, { rowIndex, colIndex, tableId: table.id }];
      return prev;
    });
  };

  const handleCellMouseUp = () => {
    if (!isMergeMode) return;
    setIsSelecting(false);
    if (selectedCells.length >= 2) {
      onSelectCell(selectedCells);
    }
  };

  const renderNestedTable = (nestedTableId) => {
    const nestedTable = (allTables || []).find(t => t.id === nestedTableId);
    if (nestedTable) {
      return (
        <Table
          table={nestedTable}
          onUpdate={onUpdate}
          onDelete={onDelete}
          onCellUpdate={onCellUpdate}
          onAddNestedTable={onAddNestedTable}
          onSelectTable={onSelectTable}
          onSelectCell={onSelectCell}
          allTables={allTables}
          document={document}
        />
      );
    }
    return null;
  };

  return (
    <div
      className={`table-container ${isMergeMode ? 'merge-mode' : ''}`}
      style={{ left: table?.position?.x ?? 0, top: table?.position?.y ?? 0 }}
      onContextMenu={(e) => handleContextMenu(e)}
    >
      <div className="table-header" style={{ width: tableWidth > 0 ? `${tableWidth}px` : 'auto' }}>
        <span>Table {table?.columns ?? 0}x{table?.rows ?? 0}</span>
        <button onClick={() => onDelete(table?.id)} className="delete-btn">×</button>
      </div>

      <div className="table-wrapper" ref={tableRef}>
        <div
          className={`table-edge top-edge ${hoverEdge === 'top' ? 'hovered' : ''}`}
          onMouseEnter={() => handleMouseEnterEdge('top')}
          onMouseLeave={handleMouseLeaveEdge}
        />
        <div
          className={`table-edge bottom-edge ${hoverEdge === 'bottom' ? 'hovered' : ''}`}
          onMouseEnter={() => handleMouseEnterEdge('bottom')}
          onMouseLeave={handleMouseLeaveEdge}
        />
        <div
          className={`table-edge left-edge ${hoverEdge === 'left' ? 'hovered' : ''}`}
          onMouseEnter={() => handleMouseEnterEdge('left')}
          onMouseLeave={handleMouseLeaveEdge}
        />
        <div
          className={`table-edge right-edge ${hoverEdge === 'right' ? 'hovered' : ''}`}
          onMouseEnter={() => handleMouseEnterEdge('right')}
          onMouseLeave={handleMouseLeaveEdge}
        />

        <table className="editable-table">
          <tbody>
            {(table?.data || []).map((row = [], rowIndex) => (
              <tr key={rowIndex} className={table?.frozenRows?.includes(rowIndex) ? 'frozen-row' : ''}>
                {(row || []).map((cell = {}, colIndex) => {
                  if (cell.merged) return null;

                  const isSelected = selectedCells.some(sc => sc.rowIndex === rowIndex && sc.colIndex === colIndex);

                  return (
                    <td
                      key={colIndex}
                      rowSpan={cell.rowSpan || 1}
                      colSpan={cell.colSpan || 1}
                      className={`
                        ${isSelected ? 'selected' : ''}
                        ${table?.frozenColumns?.includes(colIndex) ? 'frozen-column' : ''}
                        ${cell.merged ? 'merged' : ''}
                      `}
                      onMouseDown={(e) => handleCellMouseDown(rowIndex, colIndex, e)}
                      onMouseOver={() => handleCellMouseOver(rowIndex, colIndex)}
                      onMouseUp={handleCellMouseUp}
                    >
                      <Cell
                        content={cell}
                        onChange={(content) => handleCellChange(rowIndex, colIndex, content)}
                        onContextMenu={(e) => handleContextMenu(e, rowIndex, colIndex)}
                        onAddNestedTable={(rows, cols) => handleAddNestedTable(rowIndex, colIndex, rows, cols)}
                        rowIndex={rowIndex}
                        colIndex={colIndex}
                        rowSpan={cell.rowSpan || 1}
                        colSpan={cell.colSpan || 1}
                      />
                      {cell?.nestedTableId && renderNestedTable(cell.nestedTableId)}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showAddOptions && (
        <div
          className="context-menu"
          style={{ left: addOptionPosition.x, top: addOptionPosition.y }}
          onMouseLeave={() => setShowAddOptions(false)}
        >
          <div className="context-menu-item" onClick={() => handleAddTable(1, 1)}>Add Table (1x1)</div>
          <div className="context-menu-item" onClick={() => handleAddTable(2, 2)}>Add Table (2x2)</div>
          <div className="context-menu-item" onClick={() => handleAddTable(3, 3)}>Add Table (3x3)</div>
        </div>
      )}
    </div>
  );
};

export default Table;










