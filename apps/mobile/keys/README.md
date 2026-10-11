# Local signing keys

This folder is where you keep the Android/iOS signing keys (keystores, key
properties, certificates) on your own machine.

**Never commit anything here except this README.** The repo's `.gitignore`
ignores every other file in this folder, so keys placed here stay local.
Back them up somewhere safe (a password manager or secure storage); if a
keystore is lost, app updates can't be signed with the same key.
