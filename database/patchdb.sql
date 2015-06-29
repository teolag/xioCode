### 1
CREATE TABLE testing (
	id smallint(5),
	name varchar(16),
	PRIMARY KEY (id)
) ENGINE=InnoDB  DEFAULT CHARSET=utf8 COLLATE=utf8_swedish_ci;


### 2
ALTER TABLE testing ADD COLUMN age tinyint(3);

### 3
ALTER TABLE testing DROP COLUMN age;

### 4
ALTER TABLE testing ALTER COLUMN name SET DEFAULT "Arne";

### 5
DROP TABLE testing;
