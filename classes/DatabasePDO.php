<?php
class DatabasePDO {
	private $connection;

	public function __construct($server, $username, $password, $name) {
		try {
			$this->connection = new PDO('mysql:host='.$server.';dbname='.$name, $username, $password);
			$this->connection->exec('SET CHARACTER SET utf8');
		}
		catch(PDOException $e) {
			die($e->getMessage());
		}
	}
	
	public function getArray($sql, $inputs=array()) {
		$result = $this->query($sql, $inputs);
		return $result->fetchAll(PDO::FETCH_ASSOC);
	}
	
	public function getRow($sql, $inputs=array()) {
		$result = $this->query($sql, $inputs);
		return $result->fetch(PDO::FETCH_ASSOC);
	}
	
	public function getValue($sql, $inputs=array()) {
		$result = $this->query($sql, $inputs);
		return $result->fetchColumn();
	}
	
	public function query($sql, $inputs=array()) {
		try {
			$sth = $this->connection->prepare($sql);
			if(!$sth->execute($inputs)) {
				die($sth->errorInfo()[2]);
			}
		}
		catch(PDOException $e) {
			die($e->getMessage());
		}
		return $sth;
	}
	public function insert($sql, $inputs=array()) {
		$sth = $this->query($sql, $inputs);
		return $this->connection->lastInsertId();
	}
	
	public function update($sql, $inputs=array()) {
		$sth = $this->query($sql, $inputs);
		return $sth->rowCount();
	}
	
	public function execute($sql, $inputs=array()) {
		$sth = $this->query($sql, $inputs);
	}
	
}
	

?>