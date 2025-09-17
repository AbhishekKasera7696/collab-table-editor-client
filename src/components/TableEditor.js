import React, { useState, useEffect, useRef } from 'react';
import Table from './Table';
import Toolbar from './Toolbar';
import { getDocument } from '../utils/api';
import { API_BASE_URL } from '../utils/api';
import {
  getSocket,
  onUserJoined,
  onUserLeft,
  onOnlineUsers,
  onUserCursor,
  onTableUpdated,
  sendCursorPosition,
  sendTableUpdate
} from '../utils/socket';

const TableEditor = ({ username, onLogout }) => {
  // default document shape ensures tables is always an array
  const [document, setDocument] = useState({ tables: [], users: [] });
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [userCursors, setUserCursors] = useState({});
  const [selectedTable, setSelectedTable] = useState(null);
  const [selectedCell, setSelectedCell] = useState(null);
  const [selectedCells, setSelectedCells] = useState([]);
  const [isMergeMode, setIsMergeMode] = useState(false);

  const containerRef = useRef(null);

  useEffect(() => {
    loadDocument();
    setupSocketListeners();

    return () => {
      const socket = getSocket();
      if (socket) {
        socket.off('user_joined');
        socket.off('user_left');
        socket.off('online_users');
        socket.off('user_cursor');
        socket.off('table_updated');
        // optionally socket.disconnect() here if you created it here
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        sendCursorPosition({ x, y, username });
      }
    };

    if (containerRef.current) {
      containerRef.current.addEventListener('mousemove', handleMouseMove);
    }

    return () => {
      if (containerRef.current) {
        containerRef.current.removeEventListener('mousemove', handleMouseMove);
      }
    };
  }, [containerRef.current]);

  const loadDocument = async () => {
    try {
      const doc = await getDocument();
      // guard: if server returns null/undefined give a fallback
      setDocument(doc && Array.isArray(doc.tables) ? doc : { tables: [], users: [] });
    } catch (error) {
      console.error('Error loading document:', error);
      setDocument({ tables: [], users: [] });
    }
  };

  const handleToggleMergeMode = (mode) => {
    setIsMergeMode(mode);
    if (!mode) {
      setSelectedCells([]);
    }
  };

  const setupSocketListeners = () => {
    onUserJoined((user) => {
      console.log(`${user} joined`);
    });

    onUserLeft((user) => {
      console.log(`${user} left`);
      setUserCursors(prev => {
        const updated = { ...prev };
        delete updated[user];
        return updated;
      });
    });

    onOnlineUsers((users) => {
      setOnlineUsers(users || []);
    });

    onUserCursor((data) => {
      setUserCursors(prev => ({
        ...prev,
        [data.username]: data
      }));
    });

    onTableUpdated((data) => {
      // Ensure document shape
      setDocument(data.document && Array.isArray(data.document.tables) ? data.document : { tables: [], users: [] });
    });
  };

  const handleSelectCells = (cells) => {
    setSelectedCells(cells || []);
  };

  const handleDocumentUpdate = (updatedDocument) => {
    setDocument(updatedDocument && Array.isArray(updatedDocument.tables) ? updatedDocument : { tables: [], users: [] });
    sendTableUpdate({ document: updatedDocument });
  };

  const handleAddTable = (rows, cols) => {
    const newTable = {
      id: Date.now().toString(),
      rows,
      columns: cols,
      data: Array.from({ length: rows }, () => Array.from({ length: cols }, () => ({ content: '', type: 'text' }))),
      position: { x: 100, y: 100 },
      nestedTables: []
    };

    const updatedDocument = {
      ...document,
      tables: [...(document.tables || []), newTable]
    };

    handleDocumentUpdate(updatedDocument);
  };

  const handleDeleteTable = (tableId) => {
    const updatedDocument = {
      ...document,
      tables: (document.tables || []).filter(table => table.id !== tableId)
    };
    handleDocumentUpdate(updatedDocument);
  };

  const handleLogout = async () => {
    try {
      const socket = getSocket();
      if (socket && socket.connected) {
        socket.emit('logout', username);
      }

      const response = await fetch(`${API_BASE_URL}/logout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username })
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setDocument({ tables: [], users: [] });
          setOnlineUsers([]);
          setUserCursors({});
          setSelectedTable(null);
          setSelectedCell(null);
          setSelectedCells([]);
          setIsMergeMode(false);
          if (socket) socket.disconnect();
          if (onLogout) onLogout();
          return;
        }
      }
      // fallback
      if (onLogout) onLogout();
    } catch (error) {
      console.error('Error during logout:', error);
      if (onLogout) onLogout();
    }
  };

  const handleCellUpdate = (tableId, rowIndex, colIndex, content) => {
    const updatedDocument = { ...(document || {}) };
    updatedDocument.tables = Array.isArray(updatedDocument.tables) ? [...updatedDocument.tables] : [];
    const table = updatedDocument.tables.find(t => t.id === tableId);
    if (table && Array.isArray(table.data) && table.data[rowIndex]) {
      table.data = table.data.map((r, ri) => ri === rowIndex ? r.map((c, ci) => ci === colIndex ? content : c) : r);
      handleDocumentUpdate(updatedDocument);
    }
  };

  const handleAddNestedTable = (tableId, cellRow, cellCol, rows, cols) => {
    const updatedDocument = { ...(document || {}) };
    updatedDocument.tables = Array.isArray(updatedDocument.tables) ? [...updatedDocument.tables] : [];
    const table = updatedDocument.tables.find(t => t.id === tableId);
    if (table) {
      const newNestedTable = {
        id: `${tableId}-nested-${Date.now()}`,
        rows,
        columns: cols,
        data: Array.from({ length: rows }, () => Array.from({ length: cols }, () => ({ content: '', type: 'text' }))),
        position: { x: 0, y: 0 }
      };

      if (!Array.isArray(table.nestedTables)) table.nestedTables = [];
      table.nestedTables.push(newNestedTable);

      // ensure cell exists
      if (!Array.isArray(table.data)) table.data = [];
      if (!table.data[cellRow]) {
        // expand rows if needed
        table.data[cellRow] = Array.from({ length: table.columns || cols }, () => ({ content: '', type: 'text' }));
      }
      table.data[cellRow][cellCol] = {
        ...table.data[cellRow][cellCol],
        nestedTableId: newNestedTable.id
      };

      handleDocumentUpdate(updatedDocument);
    }
  };

  const handleMergeCells = (tableId, cellsToMerge) => {
    const updatedDocument = { ...(document || {}) };
    updatedDocument.tables = Array.isArray(updatedDocument.tables) ? [...updatedDocument.tables] : [];
    const table = updatedDocument.tables.find(t => t.id === tableId);

    if (table && Array.isArray(table.data) && Array.isArray(cellsToMerge) && cellsToMerge.length >= 2) {
      const sortedCells = [...cellsToMerge].sort((a, b) => {
        if (a.rowIndex !== b.rowIndex) return a.rowIndex - b.rowIndex;
        return a.colIndex - b.colIndex;
      });

      const firstCell = sortedCells[0];
      const lastCell = sortedCells[sortedCells.length - 1];

      const rowSpan = lastCell.rowIndex - firstCell.rowIndex + 1;
      const colSpan = lastCell.colIndex - firstCell.colIndex + 1;

      const mergedContent = table.data[firstCell.rowIndex][firstCell.colIndex];

      sortedCells.forEach((cell, index) => {
        if (index > 0) {
          table.data[cell.rowIndex][cell.colIndex] = {
            ...table.data[cell.rowIndex][cell.colIndex],
            merged: true,
            mergedWith: {
              row: firstCell.rowIndex,
              col: firstCell.colIndex
            }
          };
        }
      });

      table.data[firstCell.rowIndex][firstCell.colIndex] = {
        ...mergedContent,
        rowSpan,
        colSpan
      };

      handleDocumentUpdate(updatedDocument);
      setSelectedCells([]);
    }
  };

  const handleFreezeRow = (tableId, rowIndex) => {
    const updatedDocument = { ...(document || {}) };
    updatedDocument.tables = Array.isArray(updatedDocument.tables) ? [...updatedDocument.tables] : [];
    const table = updatedDocument.tables.find(t => t.id === tableId);
    if (table) {
      if (!Array.isArray(table.frozenRows)) table.frozenRows = [];
      if (table.frozenRows.includes(rowIndex)) {
        table.frozenRows = table.frozenRows.filter(r => r !== rowIndex);
      } else {
        table.frozenRows = [...table.frozenRows, rowIndex].sort((a, b) => a - b);
      }
      handleDocumentUpdate(updatedDocument);
    }
  };

  const handleFreezeColumn = (tableId, colIndex) => {
    const updatedDocument = { ...(document || {}) };
    updatedDocument.tables = Array.isArray(updatedDocument.tables) ? [...updatedDocument.tables] : [];
    const table = updatedDocument.tables.find(t => t.id === tableId);
    if (table) {
      if (!Array.isArray(table.frozenColumns)) table.frozenColumns = [];
      if (table.frozenColumns.includes(colIndex)) {
        table.frozenColumns = table.frozenColumns.filter(c => c !== colIndex);
      } else {
        table.frozenColumns = [...table.frozenColumns, colIndex].sort((a, b) => a - b);
      }
      handleDocumentUpdate(updatedDocument);
    }
  };

  const handleUnfreezeAll = (tableId, type) => {
    const updatedDocument = { ...(document || {}) };
    updatedDocument.tables = Array.isArray(updatedDocument.tables) ? [...updatedDocument.tables] : [];
    const table = updatedDocument.tables.find(t => t.id === tableId);
    if (table) {
      if (type === 'rows') table.frozenRows = [];
      else if (type === 'columns') table.frozenColumns = [];
      handleDocumentUpdate(updatedDocument);
    }
  };

  return (
    <div className="table-editor" ref={containerRef}>
      <Toolbar
        onAddTable={handleAddTable}
        onlineUsers={onlineUsers}
        selectedTable={selectedTable}
        selectedCell={selectedCell}
        selectedCells={selectedCells}
        onMergeCells={handleMergeCells}
        onFreezeRow={handleFreezeRow}
        onFreezeColumn={handleFreezeColumn}
        onUnfreezeAll={handleUnfreezeAll}
        isMergeMode={isMergeMode}
        onToggleMergeMode={handleToggleMergeMode}
        onDeleteTable={handleDeleteTable}
        onLogout={handleLogout}
        username={username}
      />

      <div className={`workspace ${isMergeMode ? 'merge-mode' : ''}`}>
        {/* defensive: ensure document.tables is an array */}
        {(document?.tables || []).map(table => (
          <Table
            key={table.id}
            table={table}
            onUpdate={handleDocumentUpdate}
            onDelete={handleDeleteTable}
            onCellUpdate={handleCellUpdate}
            onAddNestedTable={handleAddNestedTable}
            onSelectTable={setSelectedTable}
            onSelectCell={setSelectedCell}
            onSelectCells={handleSelectCells}
            allTables={document.tables || []}
            selectedCells={selectedCells.filter(cell => cell.tableId === table.id)}
            isSelected={selectedTable && selectedTable.id === table.id}
            isMergeMode={isMergeMode}
          />
        ))}
      </div>

      {Object.values(userCursors || {}).map(cursor => (
        <div
          key={cursor.username}
          className="user-cursor"
          style={{ left: cursor.x, top: cursor.y }}
        >
          <div className="cursor"></div>
          <div className="username">{cursor.username}</div>
        </div>
      ))}
    </div>
  );
};

export default TableEditor;
