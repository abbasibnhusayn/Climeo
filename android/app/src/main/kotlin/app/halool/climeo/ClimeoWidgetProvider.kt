// Climeo — developed by Halool.
//
// This is native Android code, not Dart — RemoteViews (what home screen
// widgets are actually built from) can't render a Flutter widget tree;
// that's an Android OS constraint on all home screen widgets, not a
// shortcut taken here. Data flows from lib/services/home_widget_service.dart
// (HomeWidget.saveWidgetData) into the SharedPreferences this class reads.

package app.halool.climeo

import android.appwidget.AppWidgetManager
import android.content.Context
import android.content.SharedPreferences
import android.widget.RemoteViews
import es.antonborri.home_widget.HomeWidgetLaunchIntent
import es.antonborri.home_widget.HomeWidgetProvider

class ClimeoWidgetProvider : HomeWidgetProvider() {
    override fun onUpdate(
        context: Context,
        appWidgetManager: AppWidgetManager,
        appWidgetIds: IntArray,
        widgetData: SharedPreferences
    ) {
        appWidgetIds.forEach { widgetId ->
            val views = RemoteViews(context.packageName, R.layout.climeo_widget).apply {
                val location = widgetData.getString("location_label", null) ?: "Current Location"
                val temperature = widgetData.getString("temperature", null) ?: "--°"
                val condition = widgetData.getString("condition", null) ?: "Open Climeo to update"
                val updatedAt = widgetData.getString("updated_at", null) ?: ""

                setTextViewText(R.id.widget_location, location)
                setTextViewText(R.id.widget_temperature, temperature)
                setTextViewText(R.id.widget_condition, condition)
                setTextViewText(R.id.widget_updated_at, updatedAt)

                val pendingIntent = HomeWidgetLaunchIntent.getActivity(
                    context,
                    MainActivity::class.java
                )
                setOnClickPendingIntent(R.id.widget_root, pendingIntent)
            }
            appWidgetManager.updateAppWidget(widgetId, views)
        }
    }
}
