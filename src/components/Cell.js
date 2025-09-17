import React, { useState, useRef } from 'react';

const Cell = ({ 
  content, 
  onChange, 
  onContextMenu, 
  onAddNestedTable,
  rowIndex,
  colIndex 
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [showNestedTableOptions, setShowNestedTableOptions] = useState(false);
  const cellRef = useRef(null);

  const handleDoubleClick = () => {
    setIsEditing(true);
  };

  const handleBlur = () => {
    setIsEditing(false);
  };

  const handleChange = (e) => {
    onChange({ ...content, content: e.target.value });
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        onChange({ ...content, type: 'image', content: event.target.result });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleImageUpload({ target: { files } });
    }
  };

  const handleAddNestedTableClick = (rows, cols) => {
    // Create a new nested table structure
    const nestedTable = {
      id: `nested-${Date.now()}`,
      rows,
      columns: cols,
      data: Array(rows).fill().map(() => 
        Array(cols).fill({ content: '', type: 'text' })
      )
    };
    
    // Update the cell content to include the nested table
    onChange({ 
      ...content, 
      nestedTable: nestedTable,
      type: 'nested-table'
    });
    
    setShowNestedTableOptions(false);
  };

  const handleNestedTableButtonClick = (e) => {
    e.stopPropagation();
    setShowNestedTableOptions(!showNestedTableOptions);
  };

  const handleRemoveNestedTable = () => {
    onChange({ 
      ...content, 
      nestedTable: null,
      type: 'text'
    });
  };

  const handleNestedCellChange = (nestedRowIndex, nestedColIndex, newContent) => {
    // Update the nested table data
    const updatedNestedTable = { ...content.nestedTable };
    updatedNestedTable.data[nestedRowIndex][nestedColIndex] = newContent;
    
    // Update the cell with the modified nested table
    onChange({
      ...content,
      nestedTable: updatedNestedTable
    });
  };

  return (
    <div
      className={`cell ${isHovered ? 'hovered' : ''} ${content.nestedTable ? 'has-nested' : ''}`}
      ref={cellRef}
      onDoubleClick={handleDoubleClick}
      onContextMenu={onContextMenu}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        setShowNestedTableOptions(false);
      }}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onClick={() => setShowNestedTableOptions(false)}
    >
      {isEditing && !content.nestedTable ? (
        <textarea
          value={content.content}
          onChange={handleChange}
          onBlur={handleBlur}
          autoFocus
        />
      ) : content.type === 'image' ? (
        <div className="cell-image">
          <img src={content.content} alt="Cell content" />
          <button 
            className="remove-btn"
            onClick={() => onChange({ type: 'text', content: '' })}
          >
            ×
          </button>
        </div>
      ) : content.nestedTable ? (
        <div className="nested-table-container">
          <table className="nested-table">
            <tbody>
              {content.nestedTable.data.map((row, nestedRowIndex) => (
                <tr key={nestedRowIndex}>
                  {row.map((cell, nestedColIndex) => (
                    <td key={nestedColIndex}
                    rowSpan={content.rowSpan || 1}
                    colSpan={content.colSpan || 1}
                    style={{
                      border: "1px solid #555", 
                      padding: "8px",
                      textAlign: "center",
                      verticalAlign: "middle",
                    }}>
                      <div 
                        className="nested-cell"
                        onDoubleClick={(e) => {
                          e.stopPropagation();
                          handleNestedCellChange(
                            nestedRowIndex, 
                            nestedColIndex, 
                            { ...cell, content: prompt('Enter content:', cell.content) || cell.content }
                          );
                        }}
                      >
                        {cell.content}
                      </div>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          <button 
            className="remove-nested-btn"
            onClick={handleRemoveNestedTable}
            title="Remove nested table"
          >
            ×
          </button>
        </div>
      ) : (
        <div className="cell-text">
          {content.content}
        </div>
      )}

      {isHovered && !content.nestedTable && (
        <div className="cell-actions">
          <button
            className="add-nested-btn"
            onClick={handleNestedTableButtonClick}
            title="Add nested table"
          >
            +
          </button>
          <label className="image-upload-btn" title="Upload image">
            📷
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              style={{ display: 'none' }}
            />
          </label>
          {content.content && (
            <button 
              className="clear-btn"
              onClick={() => onChange({ type: 'text', content: '' })}
              title="Clear content"
            >
              ×
            </button>
          )}
        </div>
      )}

      {showNestedTableOptions && (
        <div className="nested-table-options" onClick={(e) => e.stopPropagation()}>
          <div className="option-header">Select Table Size</div>
          <div className="size-options">
            <button onClick={() => handleAddNestedTableClick(1, 1)}>1×1</button>
            <button onClick={() => handleAddNestedTableClick(2, 2)}>2×2</button>
            <button onClick={() => handleAddNestedTableClick(3, 3)}>3×3</button>
            <button onClick={() => handleAddNestedTableClick(4, 4)}>4×4</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Cell;