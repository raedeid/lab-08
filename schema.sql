DROP TABLE IF EXISTS information;

CREATE TABLE information (
    id SERIAL PRIMARY KEY,
    city VARCHAR(255),
    latitude VARCHAR(255),
    longitude VARCHAR(255)

);
