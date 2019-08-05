mkdir -p ~/mudio2

cp application.py ../mudio2/
cp requirements.txt ../mudio2/

mkdir -p ../mudio2/controllers
cp controllers/*.py ../mudio2/controllers/
cp -r ml_prod ../mudio2/
cp -r songs ../mudio2/
cp -r uploads ../mudio2/
cp -r templates ../mudio2/
