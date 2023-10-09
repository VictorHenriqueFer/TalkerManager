const express = require('express');
const fs = require('fs').promises;

const path = require('path');
const auth = require('./middlewares/auth');

const talkersPath = path.resolve(__dirname, 'talker.json');

const app = express();
app.use(express.json());

const generateToken = require('./utils/generateToken');
const validateLogin = require('./middlewares/validateLogin');
const validateAge = require('./middlewares/validateAge');
const validateTalk = require('./middlewares/validateTalk');
const validateName = require('./middlewares/validateName');
const validateWatchedAt = require('./middlewares/validateWatchedAt');
const validateRate = require('./middlewares/validateRate');

const HTTP_OK_STATUS = 200;
const PORT = process.env.PORT || '3001';
console.log(PORT);

// não remova esse endpoint, e para o avaliador funcionar
app.get('/', (_request, response) => {
  response.status(HTTP_OK_STATUS).send();
});

app.get('/talker', async (_req, res) => {
  try {
    const talkers = JSON.parse(await fs.readFile(talkersPath, 'utf-8'));
    if (talkers.length === 0) {
      return res.status(200).json([]);
    }
    return res.status(200).json(talkers);
  } catch (err) {
    console.log(err);
    return err;
  }
});

app.get('/talker/search', auth, async (req, res) => {
  const { q } = req.query;
  const talkers = JSON.parse(await fs.readFile(talkersPath, 'utf-8'));
  const filteredTalkers = talkers.filter((talker) => talker.name.includes(q));
  console.log(filteredTalkers);
  if (q === undefined || q === '') {
    console.log('oi');
    return res.status(200).json(talkers);
  }
  return res.status(200).json(filteredTalkers);
});

app.get('/talker/:id', async (req, res) => {
  const { id } = req.params;
  const talkers = JSON.parse(await fs.readFile(talkersPath, 'utf-8'));
  const talke = talkers.find((talker) => talker.id === Number(id));
  if (!talke) return res.status(404).json({ message: 'Pessoa palestrante não encontrada' });
  return res.status(200).json(talke);
});

app.post('/login',
  validateLogin,
  async (req, res) => {
    const token = generateToken();
    return res.status(200).json({ token });
  });

app.post('/talker',
  auth,
  validateName,
  validateAge,
  validateTalk,
  validateRate,
  validateWatchedAt,
  async (req, res) => { 
    const talkers = JSON.parse(await fs.readFile(talkersPath, 'utf-8'));
    const newTalker = { id: talkers.length + 1, ...req.body };
    talkers.push(newTalker);
    await fs.writeFile(talkersPath, JSON.stringify(talkers));
    return res.status(201).json(newTalker);
  });

app.put('/talker/:id',
  auth,
  validateName,
  validateAge,
  validateTalk,
  validateWatchedAt,
  validateRate,
  async (req, res) => {
    const { id } = req.params;
    const talkers = JSON.parse(await fs.readFile(talkersPath, 'utf-8'));
    const talkerss = talkers.find((talker) => talker.id === Number(id));
    const newTalker = { id: Number(id), ...req.body };
    talkers.splice(talkerss, 1, newTalker);
    fs.writeFile(talkersPath, JSON.stringify(talkers));
    if (!talkerss) return res.status(404).json({ message: 'Pessoa palestrante não encontrada' });
    return res.status(200).json(newTalker);
  });

app.delete('/talker/:id', auth, async (req, res) => {
  const { id } = req.params;
  const talkers = JSON.parse(await fs.readFile(talkersPath, 'utf-8'));
  const index = talkers.findIndex((talker) => talker.id === Number(id));
  talkers.splice(index, 1);
  fs.writeFile(talkersPath, JSON.stringify(talkers));
  return res.sendStatus(204);
});

app.listen(3001, () => {
  console.log('Online');
});
