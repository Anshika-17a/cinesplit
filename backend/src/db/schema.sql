CREATE TYPE seat_status AS ENUM ('available', 'locked', 'booked');
CREATE TYPE booking_status AS ENUM ('confirmed', 'cancelled');

CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE cinemas (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    city VARCHAR(255) NOT NULL,
    address TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE screens (
    id SERIAL PRIMARY KEY,
    cinema_id INTEGER REFERENCES cinemas(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    total_seats INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE seats (
    id SERIAL PRIMARY KEY,
    screen_id INTEGER REFERENCES screens(id) ON DELETE CASCADE,
    seat_number INTEGER NOT NULL,
    row_label VARCHAR(10) NOT NULL
);

CREATE TABLE movies (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    poster_url VARCHAR(255),
    trailer_url VARCHAR(255),
    duration_minutes INTEGER NOT NULL
);

CREATE TABLE shows (
    id SERIAL PRIMARY KEY,
    screen_id INTEGER REFERENCES screens(id) ON DELETE CASCADE,
    movie_id INTEGER REFERENCES movies(id) ON DELETE CASCADE,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    price_per_seat DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE show_seats (
    id SERIAL PRIMARY KEY,
    show_id INTEGER REFERENCES shows(id) ON DELETE CASCADE,
    seat_id INTEGER REFERENCES seats(id) ON DELETE CASCADE,
    status seat_status NOT NULL DEFAULT 'available',
    UNIQUE (show_id, seat_id)
);

CREATE TABLE bookings (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    show_id INTEGER REFERENCES shows(id) ON DELETE CASCADE,
    status booking_status NOT NULL DEFAULT 'confirmed',
    total_amount DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE booking_seats (
    booking_id INTEGER REFERENCES bookings(id) ON DELETE CASCADE,
    show_seat_id INTEGER REFERENCES show_seats(id) ON DELETE CASCADE,
    PRIMARY KEY (booking_id, show_seat_id)
);

-- Indexes
CREATE INDEX idx_show_seats_show_status ON show_seats(show_id, status);
CREATE INDEX idx_bookings_user_id ON bookings(user_id);
CREATE INDEX idx_shows_screen_start ON shows(screen_id, start_time);
