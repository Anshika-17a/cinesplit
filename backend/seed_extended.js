require('dotenv').config();
const { Client } = require('pg');

const run = async () => {
  const client = new Client({ connectionString: process.env.POSTGRES_URI });
  try {
    await client.connect();
    console.log('Connected to DB. Running extended regional seed...');

    // 1. Clear Existing Data
    await client.query(`
      TRUNCATE TABLE booking_seats, bookings, show_seats, shows, movies, seats, screens, cinemas CASCADE;
    `);

    // 2. Insert Cinemas with regional addresses
    const cinemasData = [
      ["PVR Director's Cut", 'Gurugram', 'Ambience Mall, NH-8, Gurugram'],
      ['Cinepolis', 'Mumbai', 'Andheri West, Mumbai'],
      ['PVR ICON', 'Mumbai', 'Phoenix Palladium, Lower Parel'],
      ['INOX', 'Pune', 'Amanora Mall, Hadapsar'],
      ['Carnival Cinemas', 'Ahmedabad', 'Himalaya Mall, Drive In Rd'],
      ['Cinepolis', 'Delhi', 'DLF Avenue, Saket'],
      
      ['INOX', 'Bangalore', 'Mantri Square, Malleshwaram'],
      ['Nexus Mall Cinema', 'Bangalore', 'Koramangala'],
      ['PVR', 'Bangalore', 'Orion Mall, Rajajinagar'],
      ['Cinepolis', 'Bangalore', 'Meenakshi Mall, JP Nagar'],
      ['Inox', 'Bangalore', 'Garuda Mall, Magrath Road'],
      ['Gopalan Cinemas', 'Bangalore', 'Innovation Mall, Jayanagar'],
      
      ['AMB Cinemas', 'Hyderabad', 'Gachibowli, Hyderabad'],
      ['Prasads IMAX', 'Hyderabad', 'Necklace Road, Hyderabad'],
      ['INOX', 'Vizag', 'CMR Central, Maddilapalem'],

      ['Sathyam Cinemas', 'Chennai', 'Royapettah, Chennai'],
      ['PVR Heritage', 'Chennai', 'ECR, Chennai'],
      ['KG Cinemas', 'Coimbatore', 'Race Course Rd, Coimbatore']
    ];
    let cinemaMap = {}; // id -> {name, city}
    for (let c of cinemasData) {
      const res = await client.query('INSERT INTO cinemas (name, city, address) VALUES ($1, $2, $3) RETURNING id', c);
      cinemaMap[res.rows[0].id] = { name: c[0], city: c[1] };
    }

    // 3. Insert Screens & Seats
    let screenIds = [];
    let screenToCinema = {};
    for (let cId of Object.keys(cinemaMap)) {
      for (let s = 1; s <= 2; s++) {
        const res = await client.query('INSERT INTO screens (cinema_id, name, total_seats) VALUES ($1, $2, $3) RETURNING id', [cId, `Screen ${s}`, 60]);
        const sId = res.rows[0].id;
        screenIds.push(sId);
        screenToCinema[sId] = cId;
        
        const rows = ['A', 'B', 'C', 'D', 'E'];
        let seatQueries = [];
        for (let r of rows) {
          for (let num = 1; num <= 12; num++) {
            seatQueries.push(`(${sId}, ${num}, '${r}')`);
          }
        }
        await client.query(`INSERT INTO seats (screen_id, seat_number, row_label) VALUES ${seatQueries.join(', ')}`);
      }
    }

    // 4. Insert Original Blockbuster Movies (Using youtube-nocookie for better embed reliability)
    const moviesData = [
      ['Dune: Part Two', 'Mythic journey of Paul Atreides.', 'https://upload.wikimedia.org/wikipedia/en/8/8e/Dune_Part_Two_poster.jpg', 'https://www.youtube-nocookie.com/embed/U2Qp5pL3ovA?autoplay=1&mute=1', 166, 'UA16+', 'Sci-Fi', '{English,Hindi}'],
      ['Oppenheimer', 'The story of J. Robert Oppenheimer.', 'https://upload.wikimedia.org/wikipedia/en/4/4a/Oppenheimer_%28film%29_poster.jpg', 'https://www.youtube-nocookie.com/embed/bK6ldnjE3Y0?autoplay=1&mute=1', 180, 'A', 'Biography', '{English}'],
      ['Deadpool & Wolverine', 'Deadpool teams up with Wolverine.', 'https://upload.wikimedia.org/wikipedia/en/4/4c/Deadpool_%26_Wolverine_poster.jpg', 'https://www.youtube-nocookie.com/embed/73_1biulkYk?autoplay=1&mute=1', 127, 'A', 'Action', '{English,Hindi,Telugu,Tamil}'],
      ['Avatar: The Way of Water', 'Jake Sully lives with his newfound family on Pandora.', 'https://upload.wikimedia.org/wikipedia/en/5/54/Avatar_The_Way_of_Water_poster.jpg', 'https://www.youtube-nocookie.com/embed/d9MyW72ELq0?autoplay=1&mute=1', 192, 'UA', 'Sci-Fi', '{English,Hindi,Tamil,Telugu}'],
      ['Jawan', 'A man is driven by a personal vendetta.', 'https://upload.wikimedia.org/wikipedia/en/3/39/Jawan_film_poster.jpg', 'https://www.youtube-nocookie.com/embed/COv52Qyctws?autoplay=1&mute=1', 169, 'UA16+', 'Action', '{Hindi,Tamil,Telugu}'],
      ['Animal', "A son's love for his father.", 'https://upload.wikimedia.org/wikipedia/en/9/90/Animal_%282023_film%29_poster.jpg', 'https://www.youtube-nocookie.com/embed/DhjzM_R7cT0?autoplay=1&mute=1', 201, 'A', 'Action/Drama', '{Hindi,Telugu}'],
      ['Kalki 2898 AD', 'A modern-day avatar of Vishnu descends to Earth.', 'https://upload.wikimedia.org/wikipedia/en/4/4c/Kalki_2898_AD_poster.jpg', 'https://www.youtube-nocookie.com/embed/kqQ82-N_e-0?autoplay=1&mute=1', 181, 'UA', 'Sci-Fi', '{Telugu,Hindi,Tamil}'],
      ['RRR', 'A tale of two legendary revolutionaries.', 'https://upload.wikimedia.org/wikipedia/en/d/d7/RRR_Poster.jpg', 'https://www.youtube-nocookie.com/embed/NgBoKQy3EQg?autoplay=1&mute=1', 187, 'UA', 'Action/Epic', '{Telugu,Hindi,Tamil,Kannada}'],
      ['Salaar', 'A gang leader makes a promise to his dying friend.', 'https://upload.wikimedia.org/wikipedia/en/4/41/Salaar_Part_1_%E2%80%93_Ceasefire.jpg', 'https://www.youtube-nocookie.com/embed/4bJpA7iVbN4?autoplay=1&mute=1', 175, 'A', 'Action', '{Telugu,Hindi,Kannada}'],
      ['Leo', 'A cafe owner becomes a local hero.', 'https://upload.wikimedia.org/wikipedia/en/9/93/Leo_%282023_Indian_film%29.jpg', 'https://www.youtube-nocookie.com/embed/Po3jStA673E?autoplay=1&mute=1', 164, 'UA16+', 'Action', '{Tamil,Hindi,Telugu}'],
      ['Spider-Man: No Way Home', 'Peter Parker seeks Doctor Strange help.', 'https://upload.wikimedia.org/wikipedia/en/0/00/Spider-Man_No_Way_Home_poster.jpg', 'https://www.youtube-nocookie.com/embed/JfVOs4VSpmA?autoplay=1&mute=1', 148, 'UA', 'Action', '{English,Hindi,Tamil,Telugu}'],
      ['The Batman', 'Batman ventures into Gotham City underworld.', 'https://upload.wikimedia.org/wikipedia/en/f/f9/The_Batman_%28film%29_poster.jpg', 'https://www.youtube-nocookie.com/embed/mqqft2x_Aa4?autoplay=1&mute=1', 176, 'UA16+', 'Action', '{English,Hindi,Tamil,Telugu}']
    ];

    let moviesMap = [];
    for (let m of moviesData) {
      const res = await client.query('INSERT INTO movies (title, description, poster_url, trailer_url, duration_minutes, age_rating, genre, languages) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id', m);
      const mId = res.rows[0].id;
      moviesMap.push({
        id: mId,
        title: m[0],
        languages: m[7]
      });
    }

    // 5. Insert Shows Regionally
    console.log('Generating regional shows...');
    let showsCount = 0;
    
    for (let sId of screenIds) {
      const cId = screenToCinema[sId];
      const city = cinemaMap[cId].city;
      
      // Determine preferred language array for this city
      let preferredLangs = ['English']; // Universal
      if (['Gurugram', 'Delhi', 'Mumbai', 'Pune', 'Ahmedabad'].includes(city)) preferredLangs.push('Hindi');
      if (['Hyderabad', 'Vizag'].includes(city)) preferredLangs.push('Telugu');
      if (['Chennai', 'Coimbatore'].includes(city)) preferredLangs.push('Tamil');
      if (['Bangalore'].includes(city)) preferredLangs.push('Kannada', 'Telugu', 'Tamil', 'Hindi');
      
      // Filter movies that match city's language preferences
      const validMovies = moviesMap.filter(m => {
        return preferredLangs.some(pl => m.languages.includes(pl));
      });

      for (let day = 0; day < 3; day++) {
        for (let slot = 0; slot < 3; slot++) {
          // If no valid movies (rare), pick any
          const pool = validMovies.length > 0 ? validMovies : moviesMap;
          const randomMovie = pool[Math.floor(Math.random() * pool.length)];
          const price = 150 + Math.floor(Math.random() * 200); // 150-350
          
          const showQuery = `
            INSERT INTO shows (screen_id, movie_id, start_time, end_time, price_per_seat)
            VALUES ($1, $2, NOW() + INTERVAL '${day} days' + INTERVAL '${10 + (slot * 4)} hours', NOW() + INTERVAL '${day} days' + INTERVAL '${13 + (slot * 4)} hours', $3)
            RETURNING id
          `;
          const res = await client.query(showQuery, [sId, randomMovie.id, price]);
          const showId = res.rows[0].id;
          showsCount++;

          await client.query(`
            INSERT INTO show_seats (show_id, seat_id, status)
            SELECT $1, id, 'available' FROM seats WHERE screen_id = $2
          `, [showId, sId]);
        }
      }
    }

    console.log(`Successfully seeded ${moviesMap.length} movies and ${showsCount} shows across ${screenIds.length} screens in ${Object.keys(cinemaMap).length} cinemas!`);

  } catch (err) {
    console.error('Error:', err);
  } finally {
    await client.end();
  }
};
run();
