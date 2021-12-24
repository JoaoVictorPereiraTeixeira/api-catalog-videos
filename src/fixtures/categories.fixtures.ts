const categories: any = [];
for(let i = 1; i <= 200; i++){
  const category = {
    model: 'Category',
    fields: {
      id: `${i}-cat`,
      name: `${i}-name-category`,
      description: null,
      is_active: true,
      created_at: '2020-01-01T00:00:00+0000',
      updated_at: '2020-01-01T00:00:00+0000',
    },
  }
  categories.push(category)
}

export default categories

// [
//   {
//     model: 'Category',
//     fields: {
//       id: '1-cat',
//       name: 'Filme',
//       description: null,
//       is_active: true,
//       created_at: '2020-01-01T00:00:00+0000',
//       updated_at: '2020-01-01T00:00:00+0000',
//     },
//   },
//   {
//     model: 'Category',
//     fields: {
//       id: '2-cat',
//       name: 'Documentário',
//       description: null,
//       is_active: true,
//       created_at: '2020-01-01T00:00:01+0000',
//       updated_at: '2020-01-01T00:00:01+0000',
//     },
//   },
//   {
//     model: 'Category',
//     fields: {
//       id: '3-cat',
//       name: 'Infantil',
//       description: null,
//       is_active: true,
//       created_at: '2020-01-01T00:00:02+0000',
//       updated_at: '2020-01-01T00:00:02+0000',
//     },
//   },
//   {
//     model: 'Category',
//     fields: {
//       name: '4-'
//       description: null,
//       is_active: true,
//       created_at: '2020-01-01T00:00:02+0000',
//       updated_at: '2020-01-01T00:00:02+0000',
//     },
//   },
// ];
