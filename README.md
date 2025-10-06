
H:\LMS>echo "# LMS-portal" >> README.md

H:\LMS>git init
Initialized empty Git repository in H:/LMS/.git/

H:\LMS>git add README.md

H:\LMS>git commit -m "first commit"
[master (root-commit) 12b22ed] first commit
 1 file changed, 1 insertion(+)
 create mode 100644 README.md

H:\LMS>git branch -M main

H:\LMS>git remote add origin https://github.com/Thutukuri-mokshith-sai/LMS-portal.git

H:\LMS>git push -u origin main
Enumerating objects: 3, done.
Counting objects: 100% (3/3), done.
Writing objects: 100% (3/3), 233 bytes | 233.00 KiB/s, done.
Total 3 (delta 0), reused 0 (delta 0), pack-reused 0 (from 0)
To https://github.com/Thutukuri-mokshith-sai/LMS-portal.git
 * [new branch]      main -> main
branch 'main' set up to track 'origin/main'.

H:\LMS>git add .
warning: adding embedded git repository: lms-frontend
hint: You've added another git repository inside your current repository.
hint: Clones of the outer repository will not contain the contents of
hint: the embedded repository and will not know how to obtain it.
hint: If you meant to add a submodule, use:
hint:
hint:   git submodule add <url> lms-frontend
hint:
hint: If you added this path by mistake, you can remove it from the
hint: index with:
hint:
hint:   git rm --cached lms-frontend
hint:
hint: See "git help submodule" for more information.
hint: Disable this message with "git config advice.addEmbeddedRepo false"

H:\LMS>
