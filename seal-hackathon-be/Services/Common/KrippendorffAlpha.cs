namespace SEAL.NET.Services.Common
{
    /// <summary>
    /// Krippendorff's alpha for interval data (RQ1, alongside ICC).
    ///
    /// Alpha is reported next to ICC because it tolerates the shape this data
    /// actually has: judges do not all score every submission, and alpha is
    /// defined over whatever ratings exist per unit rather than requiring a full
    /// rectangular matrix.
    ///
    ///     alpha = 1 - Do / De
    ///
    /// Do is how much raters disagreed within units; De is how much they would be
    /// expected to disagree if ratings were assigned at random from the same pool.
    /// 1 is perfect agreement, 0 is chance, and negative values mean raters
    /// disagreed more than chance would produce.
    /// </summary>
    public static class KrippendorffAlpha
    {
        /// <param name="units">
        /// One entry per unit of analysis (a submission-criterion pair), holding the
        /// values each rater gave it. Units with fewer than two ratings carry no
        /// information about agreement and are skipped, per the standard definition.
        /// </param>
        /// <returns>Alpha, or null when the data cannot support it.</returns>
        public static double? ComputeInterval(IEnumerable<IReadOnlyList<double>> units)
        {
            var pairable = units.Where(u => u.Count >= 2).ToList();
            if (pairable.Count < 2) return null;

            // n — total pairable values across all units.
            var allValues = pairable.SelectMany(u => u).ToList();
            var n = allValues.Count;
            if (n < 2) return null;

            // Observed disagreement: mean squared difference within each unit,
            // weighted so units rated by more people do not dominate.
            double observedSum = 0;
            foreach (var unit in pairable)
            {
                double unitSum = 0;
                for (var i = 0; i < unit.Count; i++)
                {
                    for (var j = 0; j < unit.Count; j++)
                    {
                        if (i == j) continue;
                        var diff = unit[i] - unit[j];
                        unitSum += diff * diff;
                    }
                }
                observedSum += unitSum / (unit.Count - 1);
            }
            var observed = observedSum / n;

            // Expected disagreement: the same measure over every ordered pair drawn
            // from the whole pool, ignoring which unit a value came from.
            double expectedSum = 0;
            for (var i = 0; i < n; i++)
            {
                for (var j = 0; j < n; j++)
                {
                    if (i == j) continue;
                    var diff = allValues[i] - allValues[j];
                    expectedSum += diff * diff;
                }
            }
            var expected = expectedSum / (n * (n - 1.0));

            // Every rater gave the identical value everywhere: there is no variance
            // for chance to explain, so agreement is undefined rather than perfect.
            if (expected == 0) return null;

            return 1.0 - (observed / expected);
        }
    }
}
