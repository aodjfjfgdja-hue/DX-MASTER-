package com.dx.master;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Intent;
import android.content.pm.ServiceInfo;
import android.os.Build;
import android.os.IBinder;

public class KeepAliveService extends Service {
    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        String ch = "dx_master";
        NotificationManager nm = getSystemService(NotificationManager.class);
        if (Build.VERSION.SDK_INT >= 26) {
            nm.createNotificationChannel(
                new NotificationChannel(ch, "DX MASTER", NotificationManager.IMPORTANCE_LOW));
        }
        PendingIntent pi = PendingIntent.getActivity(this, 0,
            new Intent(this, MainActivity.class),
            PendingIntent.FLAG_IMMUTABLE);
        Notification n = new Notification.Builder(this, ch)
            .setContentTitle("DX MASTER")
            .setContentText("Call is running")
            .setSmallIcon(android.R.drawable.ic_btn_speak_now)
            .setContentIntent(pi)
            .setOngoing(true)
            .build();
        if (Build.VERSION.SDK_INT >= 29) {
            startForeground(1, n, ServiceInfo.FOREGROUND_SERVICE_TYPE_MICROPHONE);
        } else {
            startForeground(1, n);
        }
        return START_STICKY;
    }

    @Override
    public IBinder onBind(Intent i) {
        return null;
    }
}
