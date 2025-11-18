package com.tuapp.seguritacapp;

import androidx.test.ext.junit.runners.AndroidJUnit4;
import androidx.test.rule.ActivityTestRule;
import androidx.test.platform.app.InstrumentationRegistry;

import com.wix.detox.Detox;
import com.wix.detox.config.DetoxConfig;

import org.junit.Rule;
import org.junit.Test;
import org.junit.runner.RunWith;

@RunWith(AndroidJUnit4.class)
public class DetoxTest {
    @Rule
    public ActivityTestRule<MainActivity> activityRule = new ActivityTestRule<>(MainActivity.class, false, false);

    @Test
    public void runDetoxTests() {
        DetoxConfig config = new DetoxConfig();
        config.rnContextLoadTimeoutSec = 300;
        Detox.runTests(
                activityRule,
                InstrumentationRegistry.getInstrumentation().getTargetContext().getApplicationContext(),
                config
        );
    }
}