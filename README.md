# Getting Started with Create React App

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

# .env.json
В этот файл выносим настраиваемые для разных проектов параметры. Формат объекта
```ts
{
  // Хранение стадионов/залов
  stadium: {
    scheme_type: 'svg' | 'json' | null, // Формат интерактивной схемы
    scheme_image: boolean, // 
  }
}
```