# Adding an editor

There is no way to create a staff account from the admin panel, on purpose. If
any editor could add accounts, so could anyone who got hold of their password.

## The first account

1. Sign in to the live site at `https://your-domain.com/admin`
2. Payload will notice nobody exists yet and send you to `/admin/create-first-user`
3. Enter an email and a password, and submit

That first account is automatically an **Admin**, which means it can also create
other accounts.

## Adding your brother

1. Sign in at `/admin`
2. Go to the **Administration** group in the sidebar
3. Open **Users** and create a new entry
4. Give him an email he will remember and a password he can type
5. Set his role to **Editor**

An Editor can change products, photographs, page wording and shop details. He
cannot create or delete staff accounts, and he cannot change his own role. Only
an Admin can do either of those things.

## Roles at a glance

| | View the site | Change products and pages | Create staff accounts | Change roles |
| --- | --- | --- | --- | --- |
| Visitor | yes | no | no | no |
| Editor | yes | yes | no | no |
| Admin | yes | yes | yes | yes |

## If he forgets his password

Reset it from `/admin` while signed in as an Admin: open **Users**, open his
account, type a new password, save. There is no emailed reset link configured,
because no email service is wired up yet. Add one before giving accounts to
anyone who is not on the same network as you.

## A note on passwords

Passwords are hashed before storage and never sent back out, not even to an
admin. If you lose the only admin account, you cannot recover it from the admin
panel. Delete the user from the database directly and create a new first user.
Keep the admin login somewhere only you can reach.