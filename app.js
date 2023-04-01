const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const shortid = require('shortid');

const app = express();
app.use(bodyParser.json());

mongoose.connect('mongodb://localhost/url_shortener', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useCreateIndex: true,
});

const urlSchema = new mongoose.Schema({
  original_url: { type: String, required: true },
  shortened_url: { type: String, required: true, unique: true },
  created_at: { type: Date, default: Date.now },
});

const Url = mongoose.model('Url', urlSchema);

app.post('/api/shorten', async (req, res) => {
  const original_url = req.body.original_url;
  const shortened_url = shortid.generate();
  const newUrl = new Url({ original_url, shortened_url });
  await newUrl.save();
  res.json({ shortened_url });
});

app.get('/api/urls/:url_id', async (req, res) => {
  const url = await Url.findById(req.params.url_id);
  if (url) {
    res.json({ original_url: url.original_url, shortened_url: url.shortened_url });
  } else {
    res.status(404).json({ error: 'URL not found' });
  }
});

app.get('/api/urls/date/:date', async (req, res) => {
  const date = new Date(req.params.date);
  if (isNaN(date)) {
    res.status(400).json({ error: 'Invalid date format' });
  } else {
    const startOfDay = new Date(date.setUTCHours(0, 0, 0, 0));
    const endOfDay = new Date(date.setUTCHours(23, 59, 59, 999));
    const urls = await Url.find({
      created_at: { $gte: startOfDay, $lte: endOfDay },
    });
    res.json(urls.map(url => ({ original_url: url.original_url, shortened_url: url.shortened_url })));
  }
});

app.get('/api/urls/shortened/:shortened_url', async (req, res) => {
  const url = await Url.findOne({ shortened_url: req.params.shortened_url });
  if (url) {
    res.json({ original_url: url.original_url, shortened_url: url.shortened_url });
  } else {
    res.status(404).json({ error: 'URL not found' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
