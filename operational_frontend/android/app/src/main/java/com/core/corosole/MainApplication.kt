package com.core.corosole

import android.app.Application
import com.facebook.react.PackageList
import com.facebook.react.ReactApplication
import com.facebook.react.ReactHost
import com.facebook.react.ReactNativeHost
import com.facebook.react.ReactPackage
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.load
import com.facebook.react.defaults.DefaultReactHost.getDefaultReactHost
import com.facebook.react.defaults.DefaultReactNativeHost
import com.facebook.react.soloader.OpenSourceMergedSoMapping
import com.facebook.soloader.SoLoader
import com.reactnativecommunity.asyncstorage.AsyncStoragePackage
import com.google.android.gms.auth.api.signin.GoogleSignIn
import com.google.android.gms.auth.api.signin.GoogleSignInAccount
import com.google.android.gms.auth.api.signin.GoogleSignInClient
import com.google.android.gms.auth.api.signin.GoogleSignInOptions
import com.google.android.gms.common.api.Scope
import com.google.android.gms.common.api.ApiException

class MainApplication : Application(), ReactApplication {

    override val reactNativeHost: ReactNativeHost =
        object : DefaultReactNativeHost(this) {
            override fun getPackages(): MutableList<ReactPackage> {
        val packages = PackageList(this).packages
        // Manually add AsyncStorage package
        packages.add(AsyncStoragePackage())
        
        // Add Google Sign-In package
        // packages.add(GoogleSignInPackage()) // Not needed for @react-native-google-signin/google-signin v6+
        
        return packages
    }

            override fun getJSMainModuleName(): String = "index"

            override fun getUseDeveloperSupport(): Boolean = BuildConfig.DEBUG

            override val isNewArchEnabled: Boolean = BuildConfig.IS_NEW_ARCHITECTURE_ENABLED
            override val isHermesEnabled: Boolean = BuildConfig.IS_HERMES_ENABLED
        }

    override val reactHost: ReactHost
        get() = getDefaultReactHost(applicationContext, reactNativeHost)

    override fun onCreate() {
        super.onCreate()
        SoLoader.init(this, OpenSourceMergedSoMapping)
        if (BuildConfig.IS_NEW_ARCHITECTURE_ENABLED) {
            // If you opted-in for the New Architecture, we load the native entry point for this app.
            load()
        }
        
        // Configure Google Sign-In
        try {
            // Web client ID from Google Cloud Console
            val webClientId = "132352997002-191rb761r7moinacu45nn0iso7e7mf88.apps.googleusercontent.com"
            
            // Configure Google Sign-In options
            val gso = GoogleSignInOptions.Builder(GoogleSignInOptions.DEFAULT_SIGN_IN)
                .requestIdToken(webClientId)
                .requestEmail()
                .requestProfile()
                .build()
                
            // Initialize GoogleSignIn with the configuration
            val signInClient = GoogleSignIn.getClient(this, gso)
            
            // Log the configuration
            println("Google Sign-In configured with client ID: ${webClientId.take(5)}...")
            
        } catch (e: Exception) {
            println("Error configuring Google Sign-In: ${e.message}")
            e.printStackTrace()
        }
    }
    
    // Google Sign-In configuration is now handled in onCreate()
    // This function is kept as a placeholder for any future configuration needs
}
