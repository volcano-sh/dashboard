import React, { useState } from 'react';
import { TextField, InputAdornment, IconButton } from '@mui/material';
import { Clear } from '@mui/icons-material';

const SearchField = ({ value, onChange, onClear }) => {
  const [showClearButton, setShowClearButton] = useState(false);

  return (
    <TextField
      label="Search queues"
      variant="outlined"
      size="small"
      value={value}
      onChange={onChange}
      onMouseEnter={() => setShowClearButton(true)}
      onMouseLeave={() => setShowClearButton(false)}
      InputProps={{
        endAdornment: (
          <InputAdornment position="end">
            {showClearButton && value && (
              <IconButton
                size="small"
                onClick={onClear}
                sx={{ visibility: showClearButton ? 'visible' : 'hidden' }}
              >
                <Clear />
              </IconButton>
            )}
          </InputAdornment>
        ),
      }}
      sx={{
        '& .MuiInputBase-root': {
          pr: 0, // 移除右侧内边距，防止清除按钮改变输入框宽度
        },
        '& .MuiInputBase-input': {
          pr: 4, // 为清除按钮预留空间
        },
      }}
    />
  );
};


export default SearchField;