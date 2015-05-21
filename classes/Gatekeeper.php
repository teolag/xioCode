<?php
class Gatekeeper {
	const SALT = "d!g2%o#68AA34r296";

	private static $username;
	private static $userId;

	private static function getFromSession() {
		if(isset($_SESSION['user_id']) && $_SESSION['check']==sha1($_SESSION['username'] . $_SESSION['user_id'] . self::SALT)) {
			self::$username=$_SESSION['username'];
			self::$userId=$_SESSION['user_id'];
		} else {
			self::$userId = 0;
		}
	}

	public static function hasAccess() {
		if(!isset(self::$userId)) self::getFromSession();
		return(!empty(self::$userId));
	}

	public static function checkAccess() {
		if(!self::hasAccess()) {
			header('HTTP/1.1 401 Unauthorized');
			exit();
		}
	}

	public static function getUserId() {
		if(!isset(self::$userId)) self::getFromSession();
		return intval(self::$userId);
	}

	public static function getUser(DatabasePDO $db) {
		$userId = self::getUserId();
		if(empty($userId)) {
			return null;
		} else {
			return $db->getRow("SELECT user_id, username, email, projects_order_by, projects_order_dir FROM users WHERE user_id=?", array($userId));
		}
	}

	public static function login($username, $password, DatabasePDO $db) {
		$user = $db->getRow("SELECT user_id, email, username FROM users WHERE username=? AND password=? LIMIT 1", array($username, sha1(self::SALT.$password)));
		if(!empty($user['user_id'])) {
			$valid_ip = $db->getValue("SELECT COUNT(ip) FROM valid_remote_addresses WHERE user_id=? AND ip=? LIMIT 1", array($user['user_id'], ip2long($_SERVER['REMOTE_ADDR'])));
			if($valid_ip==1) {
				$_SESSION['user_id'] = $user['user_id'];
				$_SESSION['username'] = $username;
				$_SESSION['check'] = sha1($username . $user['user_id'] . self::SALT);
				return $user['user_id'];
			} else {
				$mail = new PHPMailer(true); // the true param means it will throw exceptions on errors, which we need to catch

				$body = sprintf("Someone tried to login to your xioCode account.<br />Date: %s<br />IP: %s<br /><br />To allow this IP to access you account, <a href='%s'>click here</a>",
					date("Y-m-d H:i:s"),
					$_SERVER['REMOTE_ADDR'],
					"http://" . $_SERVER["SERVER_NAME"] . "/scripts/validate_remote_address.php?ip=".ip2long($_SERVER['REMOTE_ADDR'])."&user_id=".$user['user_id']."&check=".md5("litesalt".ip2long($_SERVER['REMOTE_ADDR']).$user['user_id'])
				);

				try {
					$mail->AddAddress($user['email'], $user['username']);
					$mail->SetFrom('noreply@teodor.se', 'xioCode');
					$mail->Subject = 'New remote address want to access xioCode';
					$mail->MsgHTML($body);
					$mail->Send();
				} catch (phpmailerException $e) {
					die($body ."<br />" . $e->errorMessage()); //Pretty error messages from PHPMailer
				} catch (Exception $e) {
					die($e->getMessage()); //Boring error messages from anything else!
				}
				return 0;
			}
		}
		else return 0;
	}

	public static function changePassword($newPass, $db) {
		if(!isset(self::$userId)) self::getFromSession();
		$change = $db->update("UPDATE users SET password=? WHERE user_id=? LIMIT 1", array(sha1(self::SALT.$newPass), self::$userId));
		return $change;
	}
}
?>