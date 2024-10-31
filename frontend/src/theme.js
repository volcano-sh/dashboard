// src/theme.js
import { createTheme } from '@mui/material/styles';

// 更深的橙红色，更接近图片中的颜色
export const volcanoOrange = '#E34C26'; // 更深的橙红色

export const theme = createTheme({
  palette: {
    primary: {
      main: volcanoOrange,
      contrastText: '#fff', // 确保按钮文字为白色
      dark: '#B33D1F', // hover 时的颜色
      light: '#E86C47', // 较浅的变体
    },
  },
});
