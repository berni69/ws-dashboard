#!/bin/sh
#
# chkconfig: 345 99 01
# description: Dashboard 1.0
#
# vi /etc/init.d/dashgs
# chmod 755 /etc/init.d/dashgs
# chkconfig --add dashgs
# chkconfig --listi
export NODE_PATH=$NODE_PATH:/var/www/ws-dashboard/node_modules
cd /var/www/ws-dashboard/
case "$1" in
        start)
                RUNNING=`ps -ef| grep -v "grep" | grep -c "node /usr/lib/node_modules/forever/bin/monitor /var/www/ws-dashboard/server.js"`
                if [ "$RUNNING" -eq "1" ]; 
                then 
                        echo "failed. Service is running."
                        exit 0; 
                fi
                echo -n "Starting dashboard..."
                /usr/bin/forever start -s --minUptime 10000  --spinSleepTime 1000 /var/www/ws-dashboard/server.js 2>&1 >/dev/null
                echo "done."
                ;;
        stop)
                echo -n "Stopping dashboard..."
                /usr/bin/forever stop  /var/www/ws-dashboard/server.js 2>&1 >/dev/null
                echo "done."
                ;;
        restart)
                echo -n "Restarting dashboard..."
                /usr/bin/forever restart  /var/www/ws-dashboard/server.js 2>&1 >/dev/null
                echo "done."
                ;;
        *)
                echo "Usage: /etc/init.d/dashgs {start|stop|restart}"
                exit 1
                ;;
esac

exit 0 

