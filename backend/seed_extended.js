require('dotenv').config();
const { Client } = require('pg');

const run = async () => {
  const client = new Client({ connectionString: process.env.POSTGRES_URI });
  try {
    await client.connect();
    console.log('Connected to DB. Running extended regional seed...');

    // 1. Clear Existing Data and alter schema
    await client.query(`
      ALTER TABLE movies DROP COLUMN IF EXISTS movie_cast;
      ALTER TABLE movies ADD COLUMN movie_cast JSONB;
      TRUNCATE TABLE booking_seats, bookings, show_seats, shows, movies, seats, screens, cinemas, users CASCADE;
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
      for (let s = 1; s <= 4; s++) { // 4 screens per cinema to ensure high movie overlap
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

    // 4. Insert Original Blockbuster Movies
    const moviesData = [
      ['Dune: Part Two', "Paul Atreides unites with Chani and the Fremen while on a warpath of revenge against the conspirators who destroyed his family.", 'https://upload.wikimedia.org/wikipedia/en/8/8e/Dune_Part_Two_poster.jpg', 'https://www.youtube-nocookie.com/embed/U2Qp5pL3ovA?autoplay=1&mute=1', 166, 'UA16+', 'Sci-Fi', '{English,Hindi}', JSON.stringify([
        { actorName: 'Timothée Chalamet', characterName: 'Paul Atreides', photoUrl: 'https://i.pravatar.cc/150?u=Timothee' },
        { actorName: 'Zendaya', characterName: 'Chani', photoUrl: 'https://i.pravatar.cc/150?u=Zendaya' },
        { actorName: 'Rebecca Ferguson', characterName: 'Lady Jessica', photoUrl: 'https://i.pravatar.cc/150?u=Rebecca' },
        { actorName: 'Javier Bardem', characterName: 'Stilgar', photoUrl: 'https://i.pravatar.cc/150?u=Javier' }
      ])],
      ['Oppenheimer', "The story of American scientist J. Robert Oppenheimer and his role in the development of the atomic bomb.", 'https://upload.wikimedia.org/wikipedia/en/4/4a/Oppenheimer_%28film%29_poster.jpg', 'https://www.youtube-nocookie.com/embed/bK6ldnjE3Y0?autoplay=1&mute=1', 180, 'A', 'Biography', '{English}', JSON.stringify([
        { actorName: 'Cillian Murphy', characterName: 'J. Robert Oppenheimer', photoUrl: 'https://i.pravatar.cc/150?u=Cillian' },
        { actorName: 'Emily Blunt', characterName: 'Kitty Oppenheimer', photoUrl: 'https://i.pravatar.cc/150?u=Emily' },
        { actorName: 'Matt Damon', characterName: 'Leslie Groves', photoUrl: 'https://i.pravatar.cc/150?u=Matt' },
        { actorName: 'Robert Downey Jr.', characterName: 'Lewis Strauss', photoUrl: 'https://i.pravatar.cc/150?u=Robert' }
      ])],
      ['Deadpool & Wolverine', "A listless Wade Wilson toils away in civilian life with his days as the morally flexible mercenary behind him.", 'https://upload.wikimedia.org/wikipedia/en/4/4c/Deadpool_%26_Wolverine_poster.jpg', 'https://www.youtube-nocookie.com/embed/73_1biulkYk?autoplay=1&mute=1', 127, 'A', 'Action', '{English,Hindi,Telugu,Tamil}', JSON.stringify([
        { actorName: 'Ryan Reynolds', characterName: 'Deadpool', photoUrl: 'https://i.pravatar.cc/150?u=Ryan' },
        { actorName: 'Hugh Jackman', characterName: 'Wolverine', photoUrl: 'https://i.pravatar.cc/150?u=Hugh' },
        { actorName: 'Emma Corrin', characterName: 'Cassandra Nova', photoUrl: 'https://i.pravatar.cc/150?u=Emma' }
      ])],
      ['Avatar: The Way of Water', "Set more than a decade after the events of the first film, Jake Sully lives with his newfound family.", 'https://upload.wikimedia.org/wikipedia/en/5/54/Avatar_The_Way_of_Water_poster.jpg', 'https://www.youtube-nocookie.com/embed/d9MyW72ELq0?autoplay=1&mute=1', 192, 'UA', 'Sci-Fi', '{English,Hindi,Tamil,Telugu}', JSON.stringify([
        { actorName: 'Sam Worthington', characterName: 'Jake Sully', photoUrl: 'https://i.pravatar.cc/150?u=Sam' },
        { actorName: 'Zoe Saldaña', characterName: 'Neytiri', photoUrl: 'https://i.pravatar.cc/150?u=Zoe' },
        { actorName: 'Sigourney Weaver', characterName: 'Kiri', photoUrl: 'https://i.pravatar.cc/150?u=Sigourney' }
      ])],
      ['Jawan', "A high-octane action thriller which outlines the emotional journey of a man who is set to rectify the wrongs in society.", 'https://upload.wikimedia.org/wikipedia/en/3/39/Jawan_film_poster.jpg', 'https://www.youtube-nocookie.com/embed/COv52Qyctws?autoplay=1&mute=1', 169, 'UA16+', 'Action', '{Hindi,Tamil,Telugu}', JSON.stringify([
        { actorName: 'Shah Rukh Khan', characterName: 'Vikram Rathore', photoUrl: 'https://i.pravatar.cc/150?u=SRK' },
        { actorName: 'Nayanthara', characterName: 'Narmada', photoUrl: 'https://i.pravatar.cc/150?u=Nayanthara' },
        { actorName: 'Vijay Sethupathi', characterName: 'Kalee', photoUrl: 'https://i.pravatar.cc/150?u=Vijay' }
      ])],
      ['Animal', "A gripping tale of a son's obsessive love for his emotionally unavailable father.", 'https://upload.wikimedia.org/wikipedia/en/9/90/Animal_%282023_film%29_poster.jpg', 'https://www.youtube-nocookie.com/embed/DhjzM_R7cT0?autoplay=1&mute=1', 201, 'A', 'Action/Drama', '{Hindi,Telugu}', JSON.stringify([
        { actorName: 'Ranbir Kapoor', characterName: 'Ranvijay Singh', photoUrl: 'https://i.pravatar.cc/150?u=Ranbir' },
        { actorName: 'Anil Kapoor', characterName: 'Balbir Singh', photoUrl: 'https://i.pravatar.cc/150?u=Anil' },
        { actorName: 'Rashmika Mandanna', characterName: 'Geetanjali', photoUrl: 'https://i.pravatar.cc/150?u=Rashmika' }
      ])],
      ['Kalki 2898 AD', "A modern-day avatar of Vishnu descends to Earth in a distant, dystopian future to protect humanity.", 'https://upload.wikimedia.org/wikipedia/en/4/4c/Kalki_2898_AD_poster.jpg', 'https://www.youtube-nocookie.com/embed/kqQ82-N_e-0?autoplay=1&mute=1', 181, 'UA', 'Sci-Fi', '{Telugu,Hindi,Tamil}', JSON.stringify([
        { actorName: 'Prabhas', characterName: 'Bhairava', photoUrl: 'https://i.pravatar.cc/150?u=Prabhas' },
        { actorName: 'Amitabh Bachchan', characterName: 'Ashwatthama', photoUrl: 'https://i.pravatar.cc/150?u=Amitabh' },
        { actorName: 'Deepika Padukone', characterName: 'SUM-80', photoUrl: 'https://i.pravatar.cc/150?u=DeepikaP' }
      ])],
      ['RRR', "A fictitious story about two legendary Indian revolutionaries and their journey away from home.", 'https://upload.wikimedia.org/wikipedia/en/d/d7/RRR_Poster.jpg', 'https://www.youtube-nocookie.com/embed/NgBoKQy3EQg?autoplay=1&mute=1', 187, 'UA', 'Action/Epic', '{Telugu,Hindi,Tamil,Kannada}', JSON.stringify([
        { actorName: 'N.T. Rama Rao Jr.', characterName: 'Bheem', photoUrl: 'https://i.pravatar.cc/150?u=NTR' },
        { actorName: 'Ram Charan', characterName: 'Raju', photoUrl: 'https://i.pravatar.cc/150?u=Ram' },
        { actorName: 'Alia Bhatt', characterName: 'Sita', photoUrl: 'https://i.pravatar.cc/150?u=Alia' }
      ])],
      ['Salaar', "In the fictional dystopian city-state of Khansaar, a gang leader makes a promise to a dying friend.", 'https://upload.wikimedia.org/wikipedia/en/4/41/Salaar_Part_1_%E2%80%93_Ceasefire.jpg', 'https://www.youtube-nocookie.com/embed/4bJpA7iVbN4?autoplay=1&mute=1', 175, 'A', 'Action', '{Telugu,Hindi,Kannada}', JSON.stringify([
        { actorName: 'Prabhas', characterName: 'Deva', photoUrl: 'https://i.pravatar.cc/150?u=Prabhas2' },
        { actorName: 'Prithviraj Sukumaran', characterName: 'Vardha', photoUrl: 'https://i.pravatar.cc/150?u=Prithviraj' },
        { actorName: 'Shruti Haasan', characterName: 'Aadhya', photoUrl: 'https://i.pravatar.cc/150?u=Shruti' }
      ])],
      ['Leo', "A mild-mannered cafe owner becomes a local hero through an act of violence, drawing the attention of a dangerous cartel.", 'https://upload.wikimedia.org/wikipedia/en/9/93/Leo_%282023_Indian_film%29.jpg', 'https://www.youtube-nocookie.com/embed/Po3jStA673E?autoplay=1&mute=1', 164, 'UA16+', 'Action', '{Tamil,Hindi,Telugu}', JSON.stringify([
        { actorName: 'Vijay', characterName: 'Parthiban', photoUrl: 'https://i.pravatar.cc/150?u=Vijay' },
        { actorName: 'Sanjay Dutt', characterName: 'Antony Das', photoUrl: 'https://i.pravatar.cc/150?u=Sanjay' },
        { actorName: 'Trisha', characterName: 'Sathya', photoUrl: 'https://i.pravatar.cc/150?u=Trisha' }
      ])],
      ['Spider-Man: No Way Home', "With Spider-Man's identity now revealed, Peter asks Doctor Strange for help.", 'https://upload.wikimedia.org/wikipedia/en/0/00/Spider-Man_No_Way_Home_poster.jpg', 'https://www.youtube-nocookie.com/embed/JfVOs4VSpmA?autoplay=1&mute=1', 148, 'UA', 'Action', '{English,Hindi,Tamil,Telugu}', JSON.stringify([
        { actorName: 'Tom Holland', characterName: 'Peter Parker', photoUrl: 'https://i.pravatar.cc/150?u=Tom' },
        { actorName: 'Zendaya', characterName: 'MJ', photoUrl: 'https://i.pravatar.cc/150?u=Zendaya2' },
        { actorName: 'Benedict Cumberbatch', characterName: 'Doctor Strange', photoUrl: 'https://i.pravatar.cc/150?u=Benedict' }
      ])],
      ['The Batman', "When a sadistic serial killer begins murdering key political figures in Gotham, Batman is forced to investigate.", 'https://upload.wikimedia.org/wikipedia/en/f/f9/The_Batman_%28film%29_poster.jpg', 'https://www.youtube-nocookie.com/embed/mqqft2x_Aa4?autoplay=1&mute=1', 176, 'UA16+', 'Action', '{English,Hindi,Tamil,Telugu}', JSON.stringify([
        { actorName: 'Robert Pattinson', characterName: 'Bruce Wayne', photoUrl: 'https://i.pravatar.cc/150?u=Rob' },
        { actorName: 'Zoë Kravitz', characterName: 'Selina Kyle', photoUrl: 'https://i.pravatar.cc/150?u=ZoeK' },
        { actorName: 'Paul Dano', characterName: 'The Riddler', photoUrl: 'https://i.pravatar.cc/150?u=Paul' }
      ])]
    ];

    let moviesMap = [];
    for (let m of moviesData) {
      const res = await client.query('INSERT INTO movies (title, description, poster_url, trailer_url, duration_minutes, age_rating, genre, languages, movie_cast) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id', m);
      moviesMap.push({ id: res.rows[0].id, title: m[0], languages: m[7] });
    }

    // 5. Insert Shows Regionally (7 days, multiple cinemas per movie)
    console.log('Generating regional shows (7 days)...');
    let showsCount = 0;
    
    // Group screens by city
    let cityScreens = {};
    for (let sId of screenIds) {
      const city = cinemaMap[screenToCinema[sId]].city;
      if (!cityScreens[city]) cityScreens[city] = [];
      cityScreens[city].push(sId);
    }

    for (const [city, cScreens] of Object.entries(cityScreens)) {
      let preferredLangs = ['English'];
      if (['Gurugram', 'Delhi', 'Mumbai', 'Pune', 'Ahmedabad'].includes(city)) preferredLangs.push('Hindi');
      if (['Hyderabad', 'Vizag'].includes(city)) preferredLangs.push('Telugu');
      if (['Chennai', 'Coimbatore'].includes(city)) preferredLangs.push('Tamil');
      if (['Bangalore'].includes(city)) preferredLangs.push('Kannada', 'Telugu', 'Tamil', 'Hindi');
      
      const validMovies = moviesMap.filter(m => preferredLangs.some(pl => m.languages.includes(pl)));
      
      for (let i = 0; i < cScreens.length; i++) {
        const sId = cScreens[i];
        // Ensure deterministic assignment across screens in the city so multiple cinemas show the same movie
        const assignedMovie = validMovies[i % validMovies.length] || moviesMap[0];
        
        for (let day = 0; day < 7; day++) {
          for (let slot = 0; slot < 4; slot++) { // 4 shows a day (e.g. 10am, 2pm, 6pm, 10pm)
            const price = 150 + Math.floor(Math.random() * 200);
            
            const showRes = await client.query(`
              INSERT INTO shows (screen_id, movie_id, start_time, end_time, price_per_seat)
              VALUES ($1, $2, NOW() + INTERVAL '${day} days' + INTERVAL '${10 + (slot * 4)} hours', NOW() + INTERVAL '${day} days' + INTERVAL '${13 + (slot * 4)} hours', $3)
              RETURNING id
            `, [sId, assignedMovie.id, price]);
            
            const showId = showRes.rows[0].id;
            showsCount++;

            // Natural variety for fast-filling vs empty
            const isFastFilling = Math.random() < 0.25; // 25% chance of being almost full
            // booked probability: if fast filling, 80-95% booked. Otherwise, 5-30% booked.
            const bookedProb = isFastFilling ? (0.8 + Math.random() * 0.15) : (0.05 + Math.random() * 0.25);
            
            await client.query(`
              INSERT INTO show_seats (show_id, seat_id, status)
              SELECT $1, id, (CASE WHEN random() < $3 THEN 'booked' ELSE 'available' END)::seat_status 
              FROM seats WHERE screen_id = $2
            `, [showId, sId, bookedProb]);
          }
        }
      }
    }

    console.log(`Successfully seeded ${moviesMap.length} movies and ${showsCount} shows across ${screenIds.length} screens in ${Object.keys(cinemaMap).length} cinemas!`);

    // Flush redis to ensure accurate available counts in UI
    try {
      const redis = require('redis');
      const rClient = redis.createClient({ url: process.env.REDIS_URI });
      await rClient.connect();
      await rClient.flushAll();
      await rClient.disconnect();
      console.log('Cleared redis cache for accurate fast-filling states.');
    } catch (e) {
      console.error('Failed to flush redis:', e.message);
    }

  } catch (err) {
    console.error('Error:', err);
  } finally {
    await client.end();
  }
};
run();
