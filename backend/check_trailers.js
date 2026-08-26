const https = require('https');

const ids = [
  'U2Qp5pL3ovA', // Dune 2
  'bK6ldnjE3Y0', // Oppenheimer
  '73_1biulkYk', // Deadpool
  'a8Gx8wiNbs8', // Avatar 2
  '7f48l7dK0i8', // Stree 2 (fails)
  'COv52Qyctws', // Jawan
  '8FkLRUJj-o0', // Animal
  '6amIq_mP4xM', // Fighter
  'vqu4z34wENw', // Pathaan
  'kqQ82-N_e-0', // Kalki
  'NgBoKQy3EQg', // RRR
  '4bJpA7iVbN4', // Salaar
  'QKI2fL3-NlY', // Pushpa 2
  'Po3jStA673E', // Leo
  'xen3ewnbQpU', // Jailer
  'Qah9sSIXJqk'  // KGF 2
];

ids.forEach(id => {
  https.get(\`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=\${id}&format=json\`, (res) => {
    console.log(\`\${id}: \${res.statusCode}\`);
  });
});
