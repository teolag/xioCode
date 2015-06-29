SET SQL_MODE="NO_AUTO_VALUE_ON_ZERO";
SET time_zone = "+00:00";

CREATE TABLE IF NOT EXISTS logins (
  login_id mediumint(8) unsigned NOT NULL AUTO_INCREMENT,
  user_id smallint(5) unsigned NOT NULL,
  `date` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  ip int(11) NOT NULL,
  agent varchar(256) COLLATE utf8_swedish_ci NOT NULL,
  PRIMARY KEY (login_id),
  KEY user_id (user_id)
) ENGINE=InnoDB  DEFAULT CHARSET=utf8 COLLATE=utf8_swedish_ci AUTO_INCREMENT=1 ;

CREATE TABLE IF NOT EXISTS patchdb (
  patch_id smallint(5) unsigned NOT NULL,
  applied timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (patch_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_swedish_ci;

CREATE TABLE IF NOT EXISTS users (
  user_id smallint(5) unsigned NOT NULL AUTO_INCREMENT,
  email varchar(32) COLLATE utf8_swedish_ci NOT NULL,
  username varchar(16) COLLATE utf8_swedish_ci NOT NULL,
  `password` char(40) COLLATE utf8_swedish_ci NOT NULL,
  google_id varchar(25) COLLATE utf8_swedish_ci NOT NULL,
  projects_order_by enum('name','created','opened') COLLATE utf8_swedish_ci NOT NULL DEFAULT 'name',
  projects_order_dir enum('asc','desc') COLLATE utf8_swedish_ci NOT NULL DEFAULT 'asc',
  PRIMARY KEY (user_id),
  KEY google_id (google_id)
) ENGINE=InnoDB  DEFAULT CHARSET=utf8 COLLATE=utf8_swedish_ci AUTO_INCREMENT=1 ;

CREATE TABLE IF NOT EXISTS valid_remote_addresses (
  ip int(11) NOT NULL,
  user_id smallint(5) unsigned NOT NULL,
  added timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `comment` varchar(128) COLLATE utf8_swedish_ci NOT NULL,
  PRIMARY KEY (ip,user_id),
  KEY user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_swedish_ci;


ALTER TABLE `logins`
  ADD CONSTRAINT logins_ibfk_2 FOREIGN KEY (user_id) REFERENCES `users` (user_id) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `valid_remote_addresses`
  ADD CONSTRAINT valid_remote_addresses_ibfk_1 FOREIGN KEY (user_id) REFERENCES `users` (user_id) ON DELETE CASCADE ON UPDATE CASCADE;
