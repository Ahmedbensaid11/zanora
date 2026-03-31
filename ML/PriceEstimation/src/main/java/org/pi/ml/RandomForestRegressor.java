package org.pi.ml;
import org.jboss.logging.Logger;
import smile.regression.RandomForest;
import smile.data.DataFrame;
import smile.data.formula.Formula;

import java.util.*;

public class RandomForestRegressor {

    private static final Logger LOG = Logger.getLogger(RandomForestRegressor.class);

    private RandomForest model;
    private int numTrees = 100;
    private int maxDepth = 10;
    private int minNodeSize = 5;

    public RandomForestRegressor() {
        this(100, 10, 5);
    }

    public RandomForestRegressor(int numTrees, int maxDepth, int minNodeSize) {
        this.numTrees = numTrees;
        this.maxDepth = maxDepth;
        this.minNodeSize = minNodeSize;
    }

    public void train(double[][] X, double[] y) {
        LOG.infof("Training Random Forest with %d trees, max depth %d on %d samples",
                numTrees, maxDepth, X.length);

        try {
            Formula formula = Formula.lhs("price");

            model = RandomForest.fit(formula, createDataFrame(X, y)
            );

            LOG.info("Random Forest training completed successfully");
        } catch (Exception e) {
            LOG.error("Error training Random Forest", e);
            throw new RuntimeException("Failed to train Random Forest model", e);
        }
    }


    public double predict(double[] features) {
        if (model == null) {
            throw new IllegalStateException("Model has not been trained");
        }

        double[][] data = new double[1][features.length + 1];
        System.arraycopy(features, 0, data[0], 0, features.length);
        data[0][features.length] = 0.0;

        String[] columnNames = new String[features.length + 1];
        for (int i = 0; i < features.length; i++) {
            columnNames[i] = "feature_" + i;
        }
        columnNames[features.length] = "price";

        DataFrame df = DataFrame.of(data, columnNames);

        return model.predict(df)[0];
    }



    public double[] predict(double[][] features) {
        if (model == null) {
            throw new IllegalStateException("Model has not been trained");
        }

        double[] predictions = new double[features.length];
        for (int i = 0; i < features.length; i++) {
            predictions[i] = predict(features[i]);
        }
        return predictions;
    }


    public PredictionWithConfidence predictWithConfidence(double[] features) {
        if (model == null) {
            throw new IllegalStateException("Model has not been trained");
        }

        double prediction = predict(features);

        double uncertainty = Math.abs(prediction * 0.15);

        return new PredictionWithConfidence(
                prediction,
                prediction - 1.96 * uncertainty,
                prediction + 1.96 * uncertainty
        );
    }


    private DataFrame createDataFrame(double[][] X, double[] y) {
        int n = X.length;
        int p = X[0].length;

        // Create column names
        String[] columnNames = new String[p + 1];
        for (int i = 0; i < p; i++) {
            columnNames[i] = "feature_" + i;
        }
        columnNames[p] = "price";

        // Create data array
        double[][] data = new double[n][p + 1];
        for (int i = 0; i < n; i++) {
            System.arraycopy(X[i], 0, data[i], 0, p);
            data[i][p] = y[i];
        }

        return DataFrame.of(data, columnNames);
    }


    public double calculateMAE(double[][] XTest, double[] yTest) {
        double[] predictions = predict(XTest);
        double sumAbsError = 0.0;

        for (int i = 0; i < yTest.length; i++) {
            sumAbsError += Math.abs(yTest[i] - predictions[i]);
        }

        return sumAbsError / yTest.length;
    }


    public double calculateRMSE(double[][] XTest, double[] yTest) {
        double[] predictions = predict(XTest);
        double sumSquaredError = 0.0;

        for (int i = 0; i < yTest.length; i++) {
            double error = yTest[i] - predictions[i];
            sumSquaredError += error * error;
        }

        return Math.sqrt(sumSquaredError / yTest.length);
    }


    public double calculateR2(double[][] XTest, double[] yTest) {
        double[] predictions = predict(XTest);

        double yMean = Arrays.stream(yTest).average().orElse(0.0);

        double totalSS = 0.0;
        for (double y : yTest) {
            totalSS += Math.pow(y - yMean, 2);
        }

        double residualSS = 0.0;
        for (int i = 0; i < yTest.length; i++) {
            residualSS += Math.pow(yTest[i] - predictions[i], 2);
        }

        return 1.0 - (residualSS / totalSS);
    }

    public static class PredictionWithConfidence {
        public final double prediction;
        public final double lowerBound;
        public final double upperBound;

        public PredictionWithConfidence(double prediction, double lowerBound, double upperBound) {
            this.prediction = prediction;
            this.lowerBound = Math.max(0, lowerBound);
            this.upperBound = upperBound;
        }
    }
}
