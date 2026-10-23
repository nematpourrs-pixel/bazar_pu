package com.bazarbusiness

import android.os.Bundle
import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.fabricEnabled
import com.facebook.react.defaults.DefaultReactActivityDelegate
import com.facebook.react.modules.i18nmanager.I18nUtil

class MainActivity : ReactActivity() {
  override fun getMainComponentName(): String = "BazarBusiness"
  override fun onCreate(savedInstanceState: Bundle?) { val rtl=I18nUtil.getInstance(); rtl.allowRTL(applicationContext,false); rtl.forceRTL(applicationContext,false); rtl.swapLeftAndRightInRTL(applicationContext,false); super.onCreate(savedInstanceState) }
  override fun createReactActivityDelegate(): ReactActivityDelegate = DefaultReactActivityDelegate(this, mainComponentName, fabricEnabled)
}
