import express from 'express';
import fetch from 'node-fetch';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

// Set EJS as the templating engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views')); // This is where your EJS files will be stored

app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
    res.render('index'); // Render 'index.ejs'
});

app.get('/sukupolvi/:numero', async (req, res) => {
    const { numero } = req.params;
    try {
        const vastaus = await fetch(`https://pokeapi.co/api/v2/generation/${numero}/`);
        if (!vastaus.ok) throw new Error('Sukupolvea ei löytynyt');
        
        const data = await vastaus.json();
        const pokemonData = await Promise.all(data.pokemon_species.map(async (pokemon) => {
            const pokemonVastaus = await fetch(`https://pokeapi.co/api/v2/pokemon/${pokemon.name}/`);
            if (!pokemonVastaus.ok) return null;
            return pokemonVastaus.json();
        }));

        res.render('generation', { numero, pokemonData });
    } catch (error) {
        res.status(500).send(`Virhe haettaessa tietoja: ${error.message}`);
    }
});

app.get('/pokemon/:nimi', async (req, res) => {
    const { nimi } = req.params;

    try {
        const vastaus = await fetch(`https://pokeapi.co/api/v2/pokemon/${nimi}/`);
        if (!vastaus.ok) return res.status(404).send('Pokemonia ei ole');

        const pokemon = await vastaus.json();

        // Extract stats in a readable format
        const stats = pokemon.stats.map(stat => ({
            name: stat.stat.name,
            value: stat.base_stat
        }));

        res.render('pokemon', { pokemon, stats });
    } catch (error) {
        res.status(500).send('Virhe pokemon tietoja');
    }
});

app.listen(PORT, () => {
    console.log(`Tässä on pokedex portti ${PORT}`);
});
