fswatch --batch-marker=EOF -xn . | while read file event; do 
    if [ $file = "EOF" ]; then
        for file in "${list[@]}";do
            relative=${file#/Users/johnson/FYDP/}
            echo -e "\033[1;31m${relative}\033[0m"
            scp -i ~/.ssh/aws.pem $file ubuntu@ec2-3-19-221-241.us-east-2.compute.amazonaws.com:/home/ubuntu/FYDP/${relative}
        done
        echo -e "\033[1;32m --- BATCH --- \033[0m\n"
        list=()
        say done
    else
        list+=($file)
    fi
done
