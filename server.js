import express from 'express';
import fetch from 'node-fetch';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
    res.render('index');
});

// Reitti sukupolvien hakemiseen
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
        res.status(500).render('error', { message: `Virhe haettaessa tietoja: ${error.message}` });
    }
});

// Hakulomakkeen käsittely ja uudelleenohjaus oikealle reitille
app.get('/pokemon', (req, res) => {
    const nimi = req.query.nimi;
    if (!nimi) {
        return res.redirect('/');
    }
    res.redirect(`/pokemon/${nimi.toLowerCase()}`);
});

// Reitti yksittäisen Pokémonin tietojen hakemiseen
app.get('/pokemon/:nimi', async (req, res) => {
    const { nimi } = req.params;

    try {
        const pokemonNimi = nimi.toLowerCase();
        const vastaus = await fetch(`https://pokeapi.co/api/v2/pokemon/${pokemonNimi}/`);
        if (!vastaus.ok) return res.status(404).render('error', { message: 'Pokemonia ei löytynyt' });

        const pokemon = await vastaus.json();
        const stats = pokemon.stats.map(stat => ({
            name: stat.stat.name,
            value: stat.base_stat
        }));

        res.render('pokemon', { pokemon, stats });
    } catch (error) {
        res.status(500).render('error', { message: 'Virhe pokemonin tietoja haettaessa' });
    }
});

app.listen(PORT, () => {
    console.log(`Pokedex toimii portissa ${PORT}`);
});
