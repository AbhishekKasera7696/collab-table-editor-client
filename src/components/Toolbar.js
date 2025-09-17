import React, { useState } from 'react';
import { API_BASE_URL } from '../utils/api';

const Toolbar = ({ 
  onAddTable, 
  onlineUsers, 
  selectedTable, 
  selectedCell,
  selectedCells,
  onMergeCells,
  onFreezeRow,
  onFreezeColumn,
  onUnfreezeAll,
  isMergeMode,
  onToggleMergeMode,
  onDeleteTable,
  onLogout,
  username
}) => {
  const [showTableOptions, setShowTableOptions] = useState(false);
  const [showFreezeRowOptions, setShowFreezeRowOptions] = useState(false);
  const [showFreezeColumnOptions, setShowFreezeColumnOptions] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Initialize selectedCells as empty array if undefined
  const safeSelectedCells = selectedCells || [];
  
  const handleAddTableClick = (rows, cols) => {
    onAddTable(rows, cols);
    setShowTableOptions(false);
  };

  const handleMergeCells = () => {
    if (selectedTable && safeSelectedCells.length >= 2) {
      onMergeCells(selectedTable.id, safeSelectedCells);
      onToggleMergeMode(false);
    }
  };

  const handleFreezeRow = (rowIndex) => {
    if (selectedTable) {
      onFreezeRow(selectedTable.id, rowIndex);
      setShowFreezeRowOptions(false);
    }
  };

  const handleFreezeColumn = (colIndex) => {
    if (selectedTable) {
      onFreezeColumn(selectedTable.id, colIndex);
      setShowFreezeColumnOptions(false);
    }
  };

  const handleDeleteAndLogout = async () => {
    try {
      // Delete table if one is selected
      if (selectedTable && onDeleteTable) {
        onDeleteTable(selectedTable.id);
      }
      
      // Call logout API
      const response = await fetch(`${API_BASE_URL}/logout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username }),
      });
      
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          // Close the confirmation modal
          setShowDeleteConfirm(false);
          
          // Call the parent logout function to redirect to login page
          if (onLogout) {
            onLogout();
          }
        } else {
          console.error('Logout failed:', result.error);
          // Even if API fails, still logout locally
          setShowDeleteConfirm(false);
          if (onLogout) {
            onLogout();
          }
        }
      } else {
        console.error('Logout API error:', response.status);
        // Even if API fails, still logout locally
        setShowDeleteConfirm(false);
        if (onLogout) {
          onLogout();
        }
      }
    } catch (error) {
      console.error('Error during delete and logout:', error);
      // Even if there's an error, still logout locally
      setShowDeleteConfirm(false);
      if (onLogout) {
        onLogout();
      }
    }
  };

  // Check if current row is frozen
  const isRowFrozen = (rowIndex) => {
    return selectedTable && selectedTable.frozenRows && 
           selectedTable.frozenRows.includes(rowIndex);
  };

  // Check if current column is frozen
  const isColumnFrozen = (colIndex) => {
    return selectedTable && selectedTable.frozenColumns && 
           selectedTable.frozenColumns.includes(colIndex);
  };

  // Get number of rows and columns in selected table
  const getTableDimensions = () => {
    if (!selectedTable) return { rows: 0, columns: 0 };
    return { 
      rows: selectedTable.rows, 
      columns: selectedTable.columns 
    };
  };

  const { rows, columns } = getTableDimensions();

  return (
    <div className="toolbar">
      <div className="toolbar-section">
        <h3>Table Actions</h3>
        <div className="button-group">
          <button 
            className="primary-btn"
            onClick={() => setShowTableOptions(!showTableOptions)}
          >
            Add Table
          </button>
          
          {showTableOptions && (
            <div className="dropdown-menu">
              <div onClick={() => handleAddTableClick(1, 1)}>1x1 Table</div>
              <div onClick={() => handleAddTableClick(2, 2)}>2x2 Table</div>
              <div onClick={() => handleAddTableClick(3, 3)}>3x3 Table</div>
              <div onClick={() => handleAddTableClick(4, 4)}>4x4 Table</div>
            </div>
          )}

          {/* Always visible Delete Table & Logout button */}
          <button 
            className="danger-btn"
            onClick={() => setShowDeleteConfirm(true)}
            title="Delete selected table and logout"
          >
            Delete Table & Logout
          </button>        
        </div>
      </div>

      <div className="toolbar-section">
        <h3>Online Users</h3>
        <div className="online-users">
          {onlineUsers?.map(user => (
            <div key={user} className="user-badge">
              {user}
            </div>
          ))}
        </div>
      </div>

      <div className="toolbar-section">
        <h3>Cell Actions</h3>
        <div className="button-group">
          {/* Merge cells button */}
          <button 
            className={`secondary-btn ${isMergeMode ? 'active' : ''}`}
            onClick={() => onToggleMergeMode(!isMergeMode)}
            title={isMergeMode ? 'Click to exit merge mode' : 'Click to select cells to merge'}
          >
            {isMergeMode ? 'Cancel Merge' : 'Merge Cells'}
          </button>

          {safeSelectedCells.length >= 2 && isMergeMode && (
            <button 
              className="primary-btn"
              onClick={handleMergeCells}
              title="Merge selected cells"
            >
              Merge Selected ({safeSelectedCells.length})
            </button>
          )}
          
          {/* Freeze options */}
          {selectedTable && (
            <>
              <div className="freeze-options-container">
                <button 
                  className="secondary-btn"
                  onClick={() => setShowFreezeRowOptions(!showFreezeRowOptions)}
                  title="Freeze rows"
                >
                  Freeze Rows
                </button>
                
                {showFreezeRowOptions && (
                  <div className="freeze-dropdown">
                    <div className="freeze-option-header">Freeze up to row:</div>
                    {Array.from({ length: rows }, (_, i) => i).map(rowIndex => (
                      <div 
                        key={rowIndex}
                        className={`freeze-option ${isRowFrozen(rowIndex) ? 'frozen' : ''}`}
                        onClick={() => handleFreezeRow(rowIndex)}
                      >
                        Row {rowIndex + 1}
                        {isRowFrozen(rowIndex) && ' ✓'}
                      </div>
                    ))}
                    <div className="freeze-option" onClick={() => onUnfreezeAll(selectedTable.id, 'rows')}>
                      Unfreeze All Rows
                    </div>
                  </div>
                )}
              </div>

              <div className="freeze-options-container">
                <button 
                  className="secondary-btn"
                  onClick={() => setShowFreezeColumnOptions(!showFreezeColumnOptions)}
                  title="Freeze columns"
                >
                  Freeze Columns
                </button>
                
                {showFreezeColumnOptions && (
                  <div className="freeze-dropdown">
                    <div className="freeze-option-header">Freeze up to column:</div>
                    {Array.from({ length: columns }, (_, i) => i).map(colIndex => (
                      <div 
                        key={colIndex}
                        className={`freeze-option ${isColumnFrozen(colIndex) ? 'frozen' : ''}`}
                        onClick={() => handleFreezeColumn(colIndex)}
                      >
                        Column {colIndex + 1}
                        {isColumnFrozen(colIndex) && ' ✓'}
                      </div>
                    ))}
                    <div className="freeze-option" onClick={() => onUnfreezeAll(selectedTable.id, 'columns')}>
                      Unfreeze All Columns
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Delete confirmation modal */}
      {showDeleteConfirm && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Confirm Delete & Logout</h3>
            <p>Are you sure you want to delete this table and logout? This action cannot be undone.</p>
            <div className="modal-actions">
              <button 
                className="danger-btn"
                onClick={handleDeleteAndLogout}
              >
                Delete Table & Logout
              </button>
              <button 
                className="secondary-btn"
                onClick={() => setShowDeleteConfirm(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Toolbar;